import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Pool global de streams para evitar múltiplas conexões
const streamPool = new Map<string, {
  controller: ReadableStreamDefaultController;
  encoder: TextEncoder;
  keepAlive: number;
  lastActivity: number;
  isReady: boolean; // Novo: indica se pode receber mensagens
}>();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  
  // Handle GET requests for SSE streaming
  if (req.method === 'GET') {
    return handleStreamingConnection(req, url);
  }
  
  // Handle POST requests for sending messages
  if (req.method === 'POST') {
    return handleMessageSend(req);
  }

  return new Response('Method not allowed', { 
    status: 405, 
    headers: corsHeaders 
  });
});

async function validateUser(userId: string): Promise<boolean> {
  if (!userId) return false;
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) return false;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    return !error && !!data;
  } catch (error) {
    console.error('Error validating user:', error);
    return false;
  }
}

async function handleStreamingConnection(req: Request, url: URL) {
  const userId = url.searchParams.get('userId');
  const agentId = url.searchParams.get('agentId');

  if (!userId || !agentId) {
    return new Response('Missing userId or agentId', { 
      status: 400, 
      headers: corsHeaders 
    });
  }

  const isValidUser = await validateUser(userId);
  if (!isValidUser) {
    return new Response('Unauthorized', { 
      status: 401, 
      headers: corsHeaders 
    });
  }

  const streamKey = `${userId}-${agentId}`;
  
  // Verificar se já existe stream ativa
  if (streamPool.has(streamKey)) {
    console.log(`🔄 Reutilizando stream existente para ${streamKey}`);
    const existingStream = streamPool.get(streamKey)!;
    existingStream.lastActivity = Date.now();
    
    return new Response('Stream already exists', { 
      status: 409, 
      headers: corsHeaders 
    });
  }

  console.log(`🔗 Nova conexão SSE estabelecida para ${streamKey}`);

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      // Primeiro, estabelecer o stream no pool mas ainda NÃO pronto
      const streamData = {
        controller,
        encoder,
        keepAlive: 0, // Será definido depois
        lastActivity: Date.now(),
        isReady: false // Inicialmente não está pronto
      };

      // AGUARDAR um pequeno delay para garantir que tudo está configurado
      setTimeout(() => {
        // Agora marcar como pronto e enviar confirmação
        streamData.isReady = true;
        
        const data = JSON.stringify({
          type: 'connection_established',
          userId,
          agentId,
          streamKey,
          timestamp: new Date().toISOString()
        });
        
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          console.log(`✅ Conexão confirmada e marcada como PRONTA para ${streamKey}`);
        } catch (error) {
          console.error('Erro ao enviar confirmação:', error);
        }
      }, 200); // 200ms de delay para garantir sincronização

      const keepAlive = setInterval(() => {
        try {
          const currentStreamData = streamPool.get(streamKey);
          if (!currentStreamData || !currentStreamData.isReady) {
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
          if (Date.now() - currentStreamData.lastActivity > 300000) {
            console.log(`⏰ Timeout para stream ${streamKey}`);
            streamPool.delete(streamKey);
            clearInterval(keepAlive);
            try {
              controller.close();
            } catch (e) {
              console.warn('Controller already closed');
            }
          }
        } catch (error) {
          console.error('Error sending ping:', error);
          streamPool.delete(streamKey);
          clearInterval(keepAlive);
          try {
            controller.close();
          } catch (e) {
            console.warn('Controller already closed');
          }
        }
      }, 30000);

      // Atualizar o keepAlive no streamData
      streamData.keepAlive = keepAlive;
      
      // Armazenar no pool
      streamPool.set(streamKey, streamData);
    },

    cancel() {
      console.log(`🔌 Conexão SSE fechada para ${streamKey}`);
      const streamData = streamPool.get(streamKey);
      if (streamData) {
        clearInterval(streamData.keepAlive);
        streamPool.delete(streamKey);
      }
    }
  });

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
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        error: 'Missing or invalid authorization header'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { message, agentPrompt, agentName, isCustomAgent, userId, sessionId, streamKey } = await req.json();

    console.log('📨 Processing message send:', {
      userId,
      sessionId,
      agentName,
      streamKey,
      messageLength: message?.length || 0
    });

    if (!message || !agentPrompt || !agentName || !userId || !sessionId) {
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
      return new Response(JSON.stringify({
        error: 'Insufficient tokens'
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const finalStreamKey = streamKey || `${userId}-${agentName.replace(/\s+/g, '_')}`;
    const streamData = streamPool.get(finalStreamKey);

    // CORRIGIDO: Verificar se existe E se está pronto
    if (!streamData) {
      console.warn(`⚠️ No stream found for ${finalStreamKey}. Available:`, Array.from(streamPool.keys()));
      return new Response(JSON.stringify({
        error: 'No active stream connection',
        streamKey: finalStreamKey,
        availableStreams: Array.from(streamPool.keys())
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!streamData.isReady) {
      console.warn(`⚠️ Stream ${finalStreamKey} exists but is not ready yet`);
      return new Response(JSON.stringify({
        error: 'Stream connection not ready yet',
        streamKey: finalStreamKey
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Atualizar atividade do stream
    streamData.lastActivity = Date.now();

    const assistantMessageId = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Send message start event
    const startData = JSON.stringify({
      type: 'message_start',
      messageId: assistantMessageId,
      agentName,
      sessionId,
      streamKey: finalStreamKey
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
      }
    } catch (error) {
      console.warn('Could not load conversation history:', error);
    }

    // Add current message to history
    conversationHistory.push({ role: 'user', content: message });

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
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    // Process streaming response
    const reader = claudeResponse.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

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
                
                // Send content delta to client
                const deltaData = JSON.stringify({
                  type: 'content_delta',
                  messageId: assistantMessageId,
                  content: fullResponse,
                  sessionId,
                  streamKey: finalStreamKey
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

      // Send completion event
      const completeData = JSON.stringify({
        type: 'message_complete',
        messageId: assistantMessageId,
        content: fullResponse,
        sessionId,
        streamKey: finalStreamKey
      });
      streamData.controller.enqueue(streamData.encoder.encode(`data: ${completeData}\n\n`));
    }

    // Update the assistant message in database
    const tokensUsed = Math.ceil((message.length + fullResponse.length) * 1.3);
    
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
        console.error('Error updating assistant message:', updateError);
      }
    } catch (error) {
      console.error('Error updating message in database:', error);
    }

    // Consume tokens
    await supabase.rpc('consume_tokens', {
      p_user_id: userId,
      p_tokens_used: tokensUsed,
      p_feature_used: `streaming_chat_${agentName}`,
      p_prompt_tokens: Math.floor(tokensUsed * 0.7),
      p_completion_tokens: Math.floor(tokensUsed * 0.3)
    });

    console.log('✅ Streaming message completed successfully for', finalStreamKey);

    return new Response(JSON.stringify({
      success: true,
      messageId: assistantMessageId,
      tokensUsed,
      sessionId,
      streamKey: finalStreamKey
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in streaming chat:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
