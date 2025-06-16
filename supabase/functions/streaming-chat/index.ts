
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control',
};

// Mapa para armazenar controllers de stream por cliente
const clientStreams = new Map<string, ReadableStreamDefaultController>();

const debugLog = (message: string, data?: any) => {
  console.log(`[STREAMING-CHAT] ${new Date().toISOString()}: ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

async function handleStreamingConnection(req: Request, url: URL) {
  const userId = url.searchParams.get('userId');
  const agentId = url.searchParams.get('agentId');
  const streamKey = `${userId}-${agentId}`;

  if (!userId || !agentId) {
    return new Response("Missing userId or agentId", { status: 400, headers: corsHeaders });
  }

  debugLog(`Nova conexão SSE solicitada para: ${streamKey}`);

  const stream = new ReadableStream({
    start(controller) {
      clientStreams.set(streamKey, controller);
      debugLog(`Stream aberto e registrado para: ${streamKey}. Total de streams: ${clientStreams.size}`);
      
      const connectionData = JSON.stringify({
        type: 'connection_established',
        message: `Conexão estabelecida com sucesso para ${streamKey}`,
        streamKey: streamKey
      });
      controller.enqueue(`data: ${connectionData}\n\n`);
    },
    cancel() {
      clientStreams.delete(streamKey);
      debugLog(`Stream fechado e removido para: ${streamKey}. Total de streams: ${clientStreams.size}`);
    }
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}

async function handleMessageSend(req: Request) {
  try {
    const { message, agentPrompt, agentName, userId, sessionId, agentId } = await req.json();
    const streamKey = `${userId}-${agentId}`;

    debugLog(`Mensagem recebida para ${streamKey}`, { agentName, messageLength: message.length });
    
    const controller = clientStreams.get(streamKey);
    if (!controller) {
      debugLog(`ERRO: Nenhum stream ativo para ${streamKey}`);
      return new Response(JSON.stringify({ error: `Nenhuma conexão de streaming ativa para o agente ${agentName}.` }), { status: 404, headers: corsHeaders });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: tokensData, error: tokensError } = await supabase.rpc('get_available_tokens', { p_user_id: userId });

    if (tokensError || !tokensData?.[0] || tokensData[0].total_available < 1000) {
      debugLog('Tokens insuficientes', { userId, tokens: tokensData?.[0]?.total_available });
      return new Response(JSON.stringify({ error: 'Tokens insuficientes.' }), { status: 402, headers: corsHeaders });
    }
    
    const messageId = `asst_${Date.now()}`;
    const startData = JSON.stringify({ type: 'message_start', messageId, sessionId });
    controller.enqueue(`data: ${startData}\n\n`);
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 3000,
        system: agentPrompt,
        messages: [{ role: 'user', content: message }],
        stream: true
      })
    });

    if (!response.body) {
      throw new Error("O corpo da resposta do Claude está vazio.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6);
          if (jsonStr === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === 'content_block_delta' && parsed.delta.type === 'text_delta') {
              fullContent += parsed.delta.text;
              const deltaData = JSON.stringify({ type: 'content_delta', messageId, content: fullContent });
              controller.enqueue(`data: ${deltaData}\n\n`);
            }
          } catch (e) {
            // Ignorar erros de parseamento de JSON que podem ocorrer em chunks incompletos
          }
        }
      }
    }
    
    const completeData = JSON.stringify({ type: 'message_complete', messageId, content: fullContent });
    controller.enqueue(`data: ${completeData}\n\n`);

    const tokensUsed = Math.ceil(fullContent.length * 1.3);
    await supabase.rpc('consume_tokens', { p_user_id: userId, p_tokens_used: tokensUsed, p_feature_used: 'streaming_chat' });

    return new Response(JSON.stringify({ success: true, messageId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    debugLog('ERRO GERAL no envio de mensagem', { error: error.message, stack: error.stack });
    return new Response(JSON.stringify({ error: 'Erro interno do servidor.' }), { status: 500, headers: corsHeaders });
  }
}

serve(async (req) => {
  if (req.method === 'GET') {
    return await handleStreamingConnection(req, new URL(req.url));
  } else if (req.method === 'POST') {
    return await handleMessageSend(req);
  } else if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  } else {
    return new Response("Método não permitido", { status: 405, headers: corsHeaders });
  }
});
