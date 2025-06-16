
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// 🔍 DEBUG: Função para logging detalhado no backend
const debugLog = (category: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🔍 BACKEND_${category}: ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

// Pool global de streams com cleanup automático
const streamPool = new Map<string, {
  controller: ReadableStreamDefaultController;
  encoder: TextEncoder;
  keepAlive: number;
  lastActivity: number;
  isReady: boolean;
  createdAt: number;
}>();

// 🔍 DEBUG: Função para verificar estado do pool no backend
const debugPoolState = (context: string) => {
  debugLog('POOL_STATE', `${context} - Pool size: ${streamPool.size}`);
  debugLog('POOL_KEYS', 'Available streams:', Array.from(streamPool.keys()));
  streamPool.forEach((stream, key) => {
    debugLog('POOL_DETAIL', `Stream ${key}:`, {
      isReady: stream.isReady,
      lastActivity: new Date(stream.lastActivity).toISOString(),
      age: Date.now() - stream.createdAt
    });
  });
};

// Cleanup automático de streams órfãos a cada 30 segundos
setInterval(() => {
  const now = Date.now();
  debugLog('CLEANUP', 'Iniciando limpeza automática de streams');
  
  for (const [key, stream] of streamPool.entries()) {
    const age = now - stream.lastActivity;
    if (age > 300000) { // 5 minutos
      debugLog('CLEANUP', `Limpando stream inativo: ${key}`, { 
        age, 
        lastActivity: new Date(stream.lastActivity).toISOString() 
      });
      clearInterval(stream.keepAlive);
      streamPool.delete(key);
      try {
        stream.controller.close();
      } catch (e) {
        debugLog('CLEANUP', `Controller já fechado para: ${key}`, { error: e.message });
      }
    }
  }
  
  debugPoolState('PÓS_CLEANUP');
}, 30000);

serve(async (req) => {
  debugLog('REQUEST', `${req.method} ${req.url}`);
  
  if (req.method === 'OPTIONS') {
    debugLog('CORS', 'Respondendo OPTIONS');
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  
  // Handle GET requests for SSE streaming
  if (req.method === 'GET') {
    debugLog('SSE_REQUEST', 'Processando requisição SSE');
    return handleStreamingConnection(req, url);
  }
  
  // Handle POST requests for sending messages
  if (req.method === 'POST') {
    debugLog('POST_REQUEST', 'Processando envio de mensagem');
    return handleMessageSend(req);
  }

  debugLog('ERROR', `Método não permitido: ${req.method}`);
  return new Response('Method not allowed', { 
    status: 405, 
    headers: corsHeaders 
  });
});

async function validateUser(userId: string): Promise<boolean> {
  debugLog('USER_VALIDATION', 'Validando usuário', { userId });
  
  if (!userId) {
    debugLog('USER_VALIDATION', 'UserId vazio');
    return false;
  }
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      debugLog('USER_VALIDATION', 'Configuração Supabase incompleta');
      return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    const isValid = !error && !!data;
    debugLog('USER_VALIDATION', `Resultado: ${isValid}`, { error: error?.message });
    return isValid;
  } catch (error) {
    debugLog('USER_VALIDATION', 'Erro na validação', { error: error.message });
    return false;
  }
}

async function handleStreamingConnection(req: Request, url: URL) {
  const userId = url.searchParams.get('userId');
  const agentId = url.searchParams.get('agentId');

  debugLog('SSE_PARAMS', 'Parâmetros recebidos', { userId, agentId });

  if (!userId || !agentId) {
    debugLog('SSE_ERROR', 'Parâmetros obrigatórios ausentes');
    return new Response('Missing userId or agentId', { 
      status: 400, 
      headers: corsHeaders 
    });
  }

  const isValidUser = await validateUser(userId);
  if (!isValidUser) {
    debugLog('SSE_ERROR', 'Usuário não autorizado', { userId });
    return new Response('Unauthorized', { 
      status: 401, 
      headers: corsHeaders 
    });
  }

  // 🔍 DEBUG: Usar sempre userId-agentId como streamKey
  const streamKey = `${userId}-${agentId}`;
  debugLog('SSE_STREAMKEY', 'StreamKey gerado', { streamKey, userId, agentId });
  
  debugPoolState('PRÉ_VERIFICAÇÃO');
  
  // Verificar se já existe stream ativa
  if (streamPool.has(streamKey)) {
    const existingStream = streamPool.get(streamKey)!;
    debugLog('SSE_EXISTING', 'Stream já existe', { 
      streamKey, 
      isReady: existingStream.isReady,
      age: Date.now() - existingStream.createdAt
    });
    
    existingStream.lastActivity = Date.now();
    
    return new Response('Stream already exists', { 
      status: 409, 
      headers: corsHeaders 
    });
  }

  debugLog('SSE_CREATING', `🔗 Nova conexão SSE para ${streamKey}`);

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const now = Date.now();
      
      debugLog('SSE_START', 'Iniciando stream', { streamKey });
      
      // ✅ CORRIGIDO: Marcar como pronto IMEDIATAMENTE
      const streamData = {
        controller,
        encoder,
        keepAlive: 0,
        lastActivity: now,
        isReady: true, // ✅ Pronto imediatamente
        createdAt: now
      };

      debugLog('SSE_READY', '✅ Stream marcado como pronto IMEDIATAMENTE', { streamKey });

      // Enviar confirmação IMEDIATAMENTE
      const connectionData = JSON.stringify({
        type: 'connection_established',
        userId,
        agentId,
        streamKey,
        timestamp: new Date().toISOString()
      });
      
      try {
        controller.enqueue(encoder.encode(`data: ${connectionData}\n\n`));
        debugLog('SSE_CONFIRMED', '✅ Confirmação enviada IMEDIATAMENTE', { streamKey });
      } catch (error) {
        debugLog('SSE_ERROR', 'Erro ao enviar confirmação', { error: error.message, streamKey });
      }

      const keepAlive = setInterval(() => {
        try {
          const currentStreamData = streamPool.get(streamKey);
          if (!currentStreamData || !currentStreamData.isReady) {
            debugLog('KEEPALIVE', 'Stream não encontrado ou não pronto, parando keepalive', { streamKey });
            clearInterval(keepAlive);
            return;
          }
          
          const pingData = JSON.stringify({
            type: 'ping',
            streamKey,
            timestamp: new Date().toISOString()
          });
          controller.enqueue(encoder.encode(`data: ${pingData}\n\n`));
          
          // Verificar timeout (5 minutos sem atividade)
          const inactiveTime = Date.now() - currentStreamData.lastActivity;
          if (inactiveTime > 300000) {
            debugLog('KEEPALIVE', `⏰ Timeout para stream ${streamKey}`, { inactiveTime });
            streamPool.delete(streamKey);
            clearInterval(keepAlive);
            try {
              controller.close();
            } catch (e) {
              debugLog('KEEPALIVE', 'Controller já fechado no timeout', { streamKey });
            }
          }
        } catch (error) {
          debugLog('KEEPALIVE', 'Erro no keepalive', { error: error.message, streamKey });
          streamPool.delete(streamKey);
          clearInterval(keepAlive);
          try {
            controller.close();
          } catch (e) {
            debugLog('KEEPALIVE', 'Controller já fechado no erro', { streamKey });
          }
        }
      }, 30000);

      // Atualizar o keepAlive no streamData
      streamData.keepAlive = keepAlive;
      
      // Armazenar no pool
      streamPool.set(streamKey, streamData);
      debugLog('SSE_POOLED', 'Stream adicionado ao pool', { streamKey, isReady: true });
      debugPoolState('PÓS_CRIAÇÃO');
    },

    cancel() {
      debugLog('SSE_CANCEL', `🔌 Conexão SSE cancelada para ${streamKey}`);
      const streamData = streamPool.get(streamKey);
      if (streamData) {
        clearInterval(streamData.keepAlive);
        streamPool.delete(streamKey);
        debugLog('SSE_CLEANUP', 'Stream removido do pool', { streamKey });
      }
      debugPoolState('PÓS_CANCELAMENTO');
    }
  });

  debugLog('SSE_RESPONSE', 'Retornando resposta SSE', { streamKey });
  return new Response(stream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

async function handleMessageSend(req: Request) {
  debugLog('MESSAGE_SEND', 'Iniciando processamento de envio');
  
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      debugLog('MESSAGE_ERROR', 'Header de autorização inválido');
      return new Response(JSON.stringify({
        error: 'Missing or invalid authorization header'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { message, agentPrompt, agentName, isCustomAgent, userId, sessionId, agentId } = await req.json();

    debugLog('MESSAGE_PARAMS', 'Parâmetros da mensagem:', {
      userId,
      sessionId,
      agentName,
      agentId,
      messageLength: message?.length || 0,
      hasPrompt: !!agentPrompt
    });

    if (!message || !agentPrompt || !agentName || !userId || !sessionId || !agentId) {
      debugLog('MESSAGE_ERROR', 'Parâmetros obrigatórios ausentes');
      return new Response(JSON.stringify({
        error: 'Missing required parameters'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!supabaseUrl || !supabaseKey || !anthropicApiKey) {
      debugLog('MESSAGE_ERROR', 'Configuração do servidor incompleta');
      return new Response(JSON.stringify({
        error: 'Server configuration incomplete'
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user tokens
    const { data: tokensData, error: tokensError } = await supabase
      .rpc('get_available_tokens', { p_user_id: userId });

    if (tokensError || !tokensData?.[0] || tokensData[0].total_available < 1000) {
      debugLog('MESSAGE_ERROR', 'Tokens insuficientes', { tokensData, error: tokensError });
      return new Response(JSON.stringify({
        error: 'Insufficient tokens'
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 🔍 DEBUG: Usar sempre userId-agentId como streamKey
    const streamKey = `${userId}-${agentId}`;
    debugLog('MESSAGE_STREAMKEY', 'StreamKey para mensagem', { streamKey, userId, agentId });
    
    debugPoolState('PRÉ_BUSCA_STREAM');
    const streamData = streamPool.get(streamKey);

    // 🔍 DEBUG: Verificação robusta de stream
    if (!streamData) {
      debugLog('MESSAGE_ERROR', `⚠️ Nenhum stream encontrado para ${streamKey}`, {
        streamKey,
        availableStreams: Array.from(streamPool.keys()),
        poolSize: streamPool.size
      });
      return new Response(JSON.stringify({
        error: 'No active stream connection',
        streamKey: streamKey,
        availableStreams: Array.from(streamPool.keys()),
        suggestion: 'Please refresh the page and try again'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!streamData.isReady) {
      debugLog('MESSAGE_ERROR', `⚠️ Stream ${streamKey} existe mas não está pronto`, {
        streamKey,
        isReady: streamData.isReady,
        age: Date.now() - streamData.createdAt
      });
      return new Response(JSON.stringify({
        error: 'Stream connection not ready yet',
        streamKey: streamKey
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    debugLog('MESSAGE_VALIDATION', '✅ Stream encontrado e pronto', {
      streamKey,
      isReady: streamData.isReady,
      age: Date.now() - streamData.createdAt
    });

    // Atualizar atividade do stream
    streamData.lastActivity = Date.now();

    const assistantMessageId = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    debugLog('MESSAGE_START_EVENT', 'Enviando evento message_start', { assistantMessageId, streamKey });

    // Send message start event
    const startData = JSON.stringify({
      type: 'message_start',
      messageId: assistantMessageId,
      agentName,
      sessionId,
      streamKey
    });
    streamData.controller.enqueue(streamData.encoder.encode(`data: ${startData}\n\n`));

    // Get conversation history from the session
    let conversationHistory = [];
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('role, content')
        .eq('session_id', sessionId)
        .eq('streaming_complete', true)
        .order('created_at', { ascending: true })
        .limit(20);

      if (!messagesError && messagesData) {
        conversationHistory = messagesData.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        debugLog('MESSAGE_HISTORY', `Carregado histórico: ${conversationHistory.length} mensagens`);
      }
    } catch (error) {
      debugLog('MESSAGE_HISTORY', 'Não foi possível carregar histórico', { error: error.message });
    }

    // Add current message to history
    conversationHistory.push({ role: 'user', content: message });

    debugLog('CLAUDE_REQUEST', 'Chamando API Claude', {
      model: 'claude-3-5-sonnet-20241022',
      messagesCount: conversationHistory.length,
      promptLength: agentPrompt.length
    });

    // Call Claude API with streaming
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        system: agentPrompt,
        messages: conversationHistory,
        stream: true
      })
    });

    if (!claudeResponse.ok) {
      debugLog('CLAUDE_ERROR', `Erro na API Claude: ${claudeResponse.status}`);
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    debugLog('CLAUDE_STREAMING', 'Iniciando processamento de streaming');

    // Process streaming response
    const reader = claudeResponse.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          debugLog('CLAUDE_STREAMING', 'Streaming concluído');
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                fullResponse += parsed.delta.text;
                
                debugLog('CONTENT_DELTA', 'Enviando delta', {
                  messageId: assistantMessageId,
                  deltaLength: parsed.delta.text.length,
                  totalLength: fullResponse.length
                });
                
                // Send content delta to client
                const deltaData = JSON.stringify({
                  type: 'content_delta',
                  messageId: assistantMessageId,
                  content: fullResponse,
                  sessionId,
                  streamKey
                });
                streamData.controller.enqueue(streamData.encoder.encode(`data: ${deltaData}\n\n`));
                
                // Atualizar atividade
                streamData.lastActivity = Date.now();
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      debugLog('MESSAGE_COMPLETE_EVENT', 'Enviando evento message_complete', {
        messageId: assistantMessageId,
        contentLength: fullResponse.length,
        streamKey
      });

      // Send completion event
      const completeData = JSON.stringify({
        type: 'message_complete',
        messageId: assistantMessageId,
        content: fullResponse,
        sessionId,
        streamKey
      });
      streamData.controller.enqueue(streamData.encoder.encode(`data: ${completeData}\n\n`));
    }

    // Update the assistant message in database
    const tokensUsed = Math.ceil((message.length + fullResponse.length) * 1.3);
    
    debugLog('DATABASE_UPDATE', 'Atualizando mensagem no banco', {
      messageId: assistantMessageId,
      tokensUsed,
      contentLength: fullResponse.length
    });
    
    try {
      // Find and update the assistant message
      const { error: updateError } = await supabase
        .from('chat_messages')
        .update({
          content: fullResponse,
          tokens_used: tokensUsed,
          streaming_complete: true
        })
        .eq('session_id', sessionId)
        .eq('role', 'assistant')
        .eq('streaming_complete', false)
        .order('created_at', { ascending: false })
        .limit(1);

      if (updateError) {
        debugLog('DATABASE_ERROR', 'Erro ao atualizar mensagem', { error: updateError });
      } else {
        debugLog('DATABASE_SUCCESS', 'Mensagem atualizada com sucesso');
      }
    } catch (error) {
      debugLog('DATABASE_ERROR', 'Exceção ao atualizar mensagem', { error: error.message });
    }

    // Consume tokens
    await supabase.rpc('consume_tokens', {
      p_user_id: userId,
      p_tokens_used: tokensUsed,
      p_feature_used: `streaming_chat_${agentName}`,
      p_prompt_tokens: Math.floor(tokensUsed * 0.7),
      p_completion_tokens: Math.floor(tokensUsed * 0.3)
    });

    debugLog('MESSAGE_SUCCESS', '✅ Streaming message completed successfully', {
      streamKey,
      messageId: assistantMessageId,
      tokensUsed,
      contentLength: fullResponse.length
    });

    return new Response(JSON.stringify({
      success: true,
      messageId: assistantMessageId,
      tokensUsed,
      sessionId,
      streamKey
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    debugLog('MESSAGE_EXCEPTION', '❌ Erro no streaming chat', {
      error: error.message,
      stack: error.stack
    });
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
