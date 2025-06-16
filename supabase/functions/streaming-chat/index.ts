
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

// Função para validar e extrair user ID do JWT
async function validateJWT(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      debugLog('ERROR', 'Falha na validação JWT', { error: error?.message });
      return null;
    }

    return user.id;
  } catch (error) {
    debugLog('ERROR', 'Erro ao validar JWT', { error: error.message });
    return null;
  }
}

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
      // Fechar stream antigo se existir
      if (clientStreams.has(streamKey)) {
        debugLog('WARN', `Fechando stream antigo para a chave: ${streamKey}`);
        try { 
          clientStreams.get(streamKey)?.close(); 
        } catch (e) { 
          debugLog('WARN', 'Erro ao fechar stream antigo', { error: e.message });
        }
      }
      
      clientStreams.set(streamKey, controller);
      debugLog('INFO', `Stream aberto e registrado para: ${streamKey}. Streams ativos: ${clientStreams.size}`);
      
      // Enviar confirmação de conexão
      const connectionData = JSON.stringify({ type: 'connection_established' });
      controller.enqueue(`data: ${connectionData}\n\n`);
      debugLog('INFO', `Mensagem 'connection_established' enviada para ${streamKey}`);

      // Configurar ping periódico para manter conexão viva
      const pingInterval = setInterval(() => {
        try {
          if (clientStreams.has(streamKey)) {
            const pingData = JSON.stringify({ type: 'ping', timestamp: Date.now() });
            controller.enqueue(`data: ${pingData}\n\n`);
            debugLog('INFO', `Ping enviado para ${streamKey}`);
          } else {
            clearInterval(pingInterval);
          }
        } catch (error) {
          debugLog('ERROR', 'Erro ao enviar ping', { streamKey, error: error.message });
          clearInterval(pingInterval);
          clientStreams.delete(streamKey);
        }
      }, 30000); // Ping a cada 30 segundos

      // Limpar ping quando stream for cancelado
      const originalCancel = controller.cancel;
      controller.cancel = function(reason) {
        clearInterval(pingInterval);
        return originalCancel.call(this, reason);
      };
    },
    cancel(reason) {
      clientStreams.delete(streamKey);
      debugLog('INFO', `Conexão SSE fechada para: ${streamKey}. Streams ativos: ${clientStreams.size}`, { reason });
    }
  });

  return new Response(stream, {
    headers: { 
      ...corsHeaders, 
      'Content-Type': 'text/event-stream', 
      'Cache-Control': 'no-cache', 
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Nginx optimization
    },
  });
}

async function handleMessageSend(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const apiKey = req.headers.get('apikey');
    
    // Validar autenticação
    let validatedUserId: string | null = null;
    
    if (authHeader) {
      validatedUserId = await validateJWT(authHeader);
    }
    
    if (!validatedUserId && !apiKey) {
      debugLog('ERROR', 'Autenticação requerida');
      return new Response(JSON.stringify({ error: 'Autenticação requerida' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { message, agentPrompt, agentName, userId, sessionId, agentId, isCustomAgent } = await req.json();
    
    // Usar userId validado do JWT ou do payload
    const finalUserId = validatedUserId || userId;
    const streamKey = `${finalUserId}-${agentId}`;
    
    debugLog('INFO', `Mensagem recebida para ${streamKey}`, { 
      agentName, 
      messageLength: message?.length,
      hasPrompt: !!agentPrompt
    });
    
    const controller = clientStreams.get(streamKey);
    if (!controller) {
      debugLog('ERROR', `Nenhum stream ativo para ${streamKey}`);
      return new Response(JSON.stringify({ 
        error: `Nenhuma conexão de streaming ativa para o agente ${agentName}.`,
        code: 'NO_ACTIVE_STREAM'
      }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // Verificar tokens disponíveis
    debugLog('INFO', 'Verificando tokens disponíveis', { userId: finalUserId });
    const { data: tokensData, error: tokensError } = await supabase.rpc('get_available_tokens', { 
      p_user_id: finalUserId 
    });

    if (tokensError) {
      debugLog('ERROR', 'Erro ao verificar tokens', { error: tokensError });
      return new Response(JSON.stringify({ 
        error: 'Erro ao verificar tokens disponíveis',
        code: 'TOKEN_CHECK_ERROR'
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!tokensData?.[0] || tokensData[0].total_available < 1000) {
      debugLog('ERROR', 'Tokens insuficientes', { 
        userId: finalUserId, 
        tokens: tokensData?.[0]?.total_available 
      });
      return new Response(JSON.stringify({ 
        error: 'Tokens insuficientes para continuar a conversa.',
        code: 'INSUFFICIENT_TOKENS',
        available: tokensData?.[0]?.total_available || 0
      }), { 
        status: 402, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const messageId = `asst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Notificar início da mensagem
    try {
      controller.enqueue(`data: ${JSON.stringify({ 
        type: 'message_start', 
        messageId, 
        sessionId 
      })}\n\n`);
      debugLog('INFO', `Enviado message_start para ${streamKey}`, { messageId });
    } catch (error) {
      debugLog('ERROR', 'Erro ao enviar message_start', { error: error.message });
      return new Response(JSON.stringify({ 
        error: 'Erro na comunicação de streaming',
        code: 'STREAM_ERROR'
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Fazer request para Claude API
    debugLog('INFO', 'Fazendo request para Claude API', { messageId });
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
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

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      debugLog('ERROR', `Claude API error: ${claudeResponse.status}`, { errorText });
      throw new Error(`Claude API error: ${claudeResponse.status} ${claudeResponse.statusText}`);
    }

    if (!claudeResponse.body) {
      throw new Error("O corpo da resposta do Claude está vazio.");
    }

    const reader = claudeResponse.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";
    let tokensUsed = 0;

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
                tokensUsed += 1; // Estimativa aproximada
                
                // Enviar delta apenas se stream ainda estiver ativo
                if (clientStreams.has(streamKey)) {
                  const deltaData = JSON.stringify({ 
                    type: 'content_delta', 
                    messageId, 
                    content: fullContent
                  });
                  controller.enqueue(`data: ${deltaData}\n\n`);
                }
              } else if (parsed.type === 'message_start') {
                debugLog('INFO', 'Claude message started', { messageId });
              } else if (parsed.type === 'content_block_start') {
                debugLog('INFO', 'Claude content block started', { messageId });
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
    
    // Enviar mensagem completa
    if (clientStreams.has(streamKey)) {
      const completeData = JSON.stringify({ 
        type: 'message_complete', 
        messageId, 
        content: fullContent
      });
      controller.enqueue(`data: ${completeData}\n\n`);
      debugLog('INFO', `Enviado message_complete para ${streamKey}`, { 
        messageId, 
        contentLength: fullContent.length,
        tokensUsed
      });
    }

    // Consumir tokens
    const finalTokensUsed = Math.max(tokensUsed, Math.ceil(fullContent.length * 1.3));
    try {
      await supabase.rpc('consume_tokens', { 
        p_user_id: finalUserId, 
        p_tokens_used: finalTokensUsed, 
        p_feature_used: 'streaming_chat' 
      });
      debugLog('INFO', 'Tokens consumidos com sucesso', { 
        userId: finalUserId, 
        tokensUsed: finalTokensUsed 
      });
    } catch (error) {
      debugLog('ERROR', 'Erro ao consumir tokens', { error: error.message });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      messageId,
      tokensUsed: finalTokensUsed
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
    
  } catch (e) {
    debugLog('ERROR', 'Erro no handleMessageSend', { error: e.message, stack: e.stack });
    
    const errorResponse = {
      error: 'Erro interno do servidor ao enviar mensagem.',
      code: 'INTERNAL_ERROR',
      details: e.message
    };
    
    return new Response(JSON.stringify(errorResponse), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

serve(async (req) => {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Handle streaming connection (GET)
    if (req.method === 'GET') {
      return await handleStreamingConnection(req);
    }
    
    // Handle message sending (POST)
    if (req.method === 'POST') {
      return await handleMessageSend(req);
    }
    
    return new Response("Método não permitido", { 
      status: 405, 
      headers: corsHeaders 
    });
    
  } catch (e) {
    debugLog('ERROR', 'Erro fatal na Edge Function', { error: e.message, stack: e.stack });
    return new Response(JSON.stringify({ 
      error: 'Erro interno fatal no servidor.',
      code: 'FATAL_ERROR'
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
