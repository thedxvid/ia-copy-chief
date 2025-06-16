import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

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

async function handleStreamingConnection(req: Request, url: URL) {
  const userId = url.searchParams.get('userId');
  const agentId = url.searchParams.get('agentId');

  if (!userId || !agentId) {
    return new Response('Missing userId or agentId', { 
      status: 400, 
      headers: corsHeaders 
    });
  }

  console.log(`🔗 SSE connection established for user ${userId}, agent ${agentId}`);

  // Create SSE response
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      // Send initial connection confirmation
      const data = JSON.stringify({
        type: 'connection_established',
        userId,
        agentId,
        timestamp: new Date().toISOString()
      });
      
      controller.enqueue(encoder.encode(`data: ${data}\n\n`));

      // Keep connection alive with periodic pings
      const keepAlive = setInterval(() => {
        try {
          const pingData = JSON.stringify({
            type: 'ping',
            timestamp: new Date().toISOString()
          });
          controller.enqueue(encoder.encode(`data: ${pingData}\n\n`));
        } catch (error) {
          console.error('Error sending ping:', error);
          clearInterval(keepAlive);
          controller.close();
        }
      }, 30000); // Ping every 30 seconds

      // Store controller for later use (in production, use Redis or similar)
      globalThis[`stream_${userId}_${agentId}`] = { controller, encoder, keepAlive };
    },

    cancel() {
      console.log(`🔌 SSE connection closed for user ${userId}, agent ${agentId}`);
      const streamData = globalThis[`stream_${userId}_${agentId}`];
      if (streamData?.keepAlive) {
        clearInterval(streamData.keepAlive);
      }
      delete globalThis[`stream_${userId}_${agentId}`];
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
    const { message, agentPrompt, agentName, isCustomAgent, userId, messageId } = await req.json();

    console.log('📨 Processing message send:', {
      userId,
      messageId,
      agentName,
      messageLength: message?.length || 0
    });

    if (!message || !agentPrompt || !agentName || !userId || !messageId) {
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

    // Get SSE connection for streaming response
    const streamKey = `stream_${userId}_${agentPrompt.split(' ')[0] || 'agent'}`;
    const streamData = globalThis[streamKey];

    if (!streamData) {
      console.warn(`⚠️ No active stream found for ${streamKey}`);
    }

    // Send message start event
    if (streamData) {
      const startData = JSON.stringify({
        type: 'message_start',
        messageId: `assistant-${Date.now()}`,
        agentName
      });
      streamData.controller.enqueue(streamData.encoder.encode(`data: ${startData}\n\n`));
    }

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
        messages: [{ role: 'user', content: message }],
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
    const assistantMessageId = `assistant-${Date.now()}`;

    if (reader && streamData) {
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
                  content: fullResponse
                });
                streamData.controller.enqueue(streamData.encoder.encode(`data: ${deltaData}\n\n`));
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
        content: fullResponse
      });
      streamData.controller.enqueue(streamData.encoder.encode(`data: ${completeData}\n\n`));
    }

    // Consume tokens
    const tokensUsed = Math.ceil((message.length + fullResponse.length) * 1.3);
    await supabase.rpc('consume_tokens', {
      p_user_id: userId,
      p_tokens_used: tokensUsed,
      p_feature_used: `streaming_chat_${agentName}`,
      p_prompt_tokens: Math.floor(tokensUsed * 0.7),
      p_completion_tokens: Math.floor(tokensUsed * 0.3)
    });

    console.log('✅ Streaming message completed successfully');

    return new Response(JSON.stringify({
      success: true,
      messageId: assistantMessageId,
      tokensUsed
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
