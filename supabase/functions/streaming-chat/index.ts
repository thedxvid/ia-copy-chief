
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const clientStreams = new Map<string, ReadableStreamDefaultController>();
const debugLog = (level: 'INFO' | 'WARN' | 'ERROR', message: string, data?: any) => {
  console.log(`[${level}] ${new Date().toISOString()}: ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

async function handleStreamingConnection(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  const agentId = url.searchParams.get('agentId');

  if (!userId || !agentId) {
    debugLog('ERROR', 'Conexão SSE recusada. Faltando userId ou agentId.');
    return new Response("Missing userId or agentId", { status: 400, headers: corsHeaders });
  }

  const streamKey = `${userId}-${agentId}`;
  debugLog('INFO', `Nova conexão SSE solicitada para a chave: ${streamKey}`);

  const stream = new ReadableStream({
    start(controller) {
      if (clientStreams.has(streamKey)) {
        debugLog('WARN', `Fechando stream antigo para a chave: ${streamKey}`);
        try { clientStreams.get(streamKey)?.close(); } catch (e) { /* ignore */ }
      }
      clientStreams.set(streamKey, controller);
      debugLog('INFO', `Stream aberto e registrado para: ${streamKey}. Streams ativos: ${clientStreams.size}`);
      
      const connectionData = JSON.stringify({ type: 'connection_established' });
      controller.enqueue(`data: ${connectionData}\n\n`);
      debugLog('INFO', `Mensagem 'connection_established' enviada para ${streamKey}`);
    },
    cancel() {
      clientStreams.delete(streamKey);
      debugLog('INFO', `Conexão SSE fechada para: ${streamKey}. Streams ativos: ${clientStreams.size}`);
    }
  });

  return new Response(stream, {
    headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  });
}

async function handleMessageSend(req: Request) {
  try {
    const { message, agentPrompt, agentName, userId, sessionId, agentId } = await req.json();
    const streamKey = `${userId}-${agentId}`;
    debugLog('INFO', `Mensagem recebida para ${streamKey}`, { agentName });
    
    const controller = clientStreams.get(streamKey);
    if (!controller) {
      debugLog('ERROR', `Nenhum stream ativo para ${streamKey}`);
      return new Response(JSON.stringify({ error: `Nenhuma conexão de streaming ativa para o agente ${agentName}.` }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    
    // Verificar tokens disponíveis
    const { data: tokensData, error: tokensError } = await supabase.rpc('get_available_tokens', { p_user_id: userId });

    if (tokensError || !tokensData?.[0] || tokensData[0].total_available < 1000) {
      debugLog('ERROR', 'Tokens insuficientes', { userId, tokens: tokensData?.[0]?.total_available });
      return new Response(JSON.stringify({ error: 'Tokens insuficientes.' }), { 
        status: 402, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const messageId = `asst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    controller.enqueue(`data: ${JSON.stringify({ type: 'message_start', messageId, sessionId })}\n\n`);
    debugLog('INFO', `Enviado message_start para ${streamKey}`, { messageId });
    
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

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error("O corpo da resposta do Claude está vazio.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";

    try {
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
                
                if (clientStreams.has(streamKey)) {
                  const deltaData = JSON.stringify({ 
                    type: 'content_delta', 
                    messageId, 
                    content: fullContent
                  });
                  controller.enqueue(`data: ${deltaData}\n\n`);
                }
              }
            } catch (e) {
              debugLog('WARN', 'Erro ao parsear chunk JSON', { error: e.message, jsonStr });
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
    
    if (clientStreams.has(streamKey)) {
      const completeData = JSON.stringify({ 
        type: 'message_complete', 
        messageId, 
        content: fullContent
      });
      controller.enqueue(`data: ${completeData}\n\n`);
      debugLog('INFO', `Enviado message_complete para ${streamKey}`, { messageId, contentLength: fullContent.length });
    }

    // Consumir tokens
    const tokensUsed = Math.ceil(fullContent.length * 1.3);
    await supabase.rpc('consume_tokens', { 
      p_user_id: userId, 
      p_tokens_used: tokensUsed, 
      p_feature_used: 'streaming_chat' 
    });

    return new Response(JSON.stringify({ success: true, messageId }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (e) {
    debugLog('ERROR', 'Erro no handleMessageSend', { error: e.message, stack: e.stack });
    return new Response(JSON.stringify({ error: 'Erro interno do servidor ao enviar mensagem.' }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    if (req.method === 'GET') return await handleStreamingConnection(req);
    if (req.method === 'POST') return await handleMessageSend(req);
    return new Response("Método não permitido", { status: 405, headers: corsHeaders });
  } catch (e) {
    debugLog('ERROR', 'Erro fatal na Edge Function', { error: e.message, stack: e.stack });
    return new Response(JSON.stringify({ error: 'Erro interno fatal no servidor.' }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
