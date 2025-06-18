
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, agentPrompt, chatHistory, agentName, isCustomAgent, userId, streaming = false } = await req.json();

    console.log('=== CHAT REQUEST DEBUG ===');
    console.log('User ID:', userId);
    console.log('Agent Name:', agentName);
    console.log('Is Custom Agent:', isCustomAgent);
    console.log('Message Length:', message.length);
    console.log('Agent Prompt Length:', agentPrompt?.length || 0);
    console.log('Streaming enabled:', streaming);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    console.log('=== ENVIRONMENT CHECK ===');
    console.log('Supabase URL:', supabaseUrl ? 'OK' : 'MISSING');
    console.log('Supabase Key:', supabaseKey ? 'OK' : 'MISSING');
    console.log('AI API Key:', anthropicApiKey ? 'OK' : 'MISSING');

    if (!supabaseUrl || !supabaseKey || !anthropicApiKey) {
      throw new Error('Configuração de ambiente incompleta');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar tokens disponíveis se userId fornecido
    if (userId) {
      console.log('=== TOKEN VERIFICATION ===');
      
      const { data: tokensData, error: tokensError } = await supabase
        .rpc('get_available_tokens', { p_user_id: userId });

      if (tokensError) {
        console.error('Erro ao verificar tokens:', tokensError);
        throw new Error('Erro ao verificar tokens disponíveis');
      }

      const userTokens = tokensData?.[0];
      console.log('User tokens:', userTokens);

      // Estimar tokens necessários para o modelo de IA
      const systemPromptLength = agentPrompt?.length || 0;
      const messageLength = message.length;
      const historyLength = chatHistory?.reduce((acc: number, msg: any) => acc + msg.content.length, 0) || 0;
      
      const estimatedTokens = Math.ceil((systemPromptLength + messageLength + historyLength) * 1.3) + 1000; // Buffer para resposta
      console.log('Tokens estimados necessários:', estimatedTokens);

      if (!userTokens || userTokens.total_available < estimatedTokens) {
        throw new Error(`Tokens insuficientes. Você tem ${userTokens?.total_available || 0} tokens disponíveis e precisa de aproximadamente ${estimatedTokens} tokens para esta conversa.`);
      }
    }

    // Preparar mensagens para o modelo de IA
    const messages = [];
    
    if (chatHistory && chatHistory.length > 0) {
      chatHistory.forEach((msg: any) => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }
    
    messages.push({
      role: 'user',
      content: message
    });

    console.log('=== AI API CALL ===');
    console.log('Messages count:', messages.length);
    console.log('System prompt length:', agentPrompt?.length || 0);

    const requestBody = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: agentPrompt || `Você é ${agentName || 'um assistente útil'}. Responda de forma clara, direta e útil.`,
      messages: messages,
      stream: streaming
    };

    console.log('Request body structure:', {
      model: requestBody.model,
      max_tokens: requestBody.max_tokens,
      system_length: requestBody.system.length,
      messages_count: requestBody.messages.length
    });

    console.log('Tentativa 1/3 com modelo de IA avançado');
    console.log('Calling AI API...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ AI API error:', response.status, errorText);
      
      if (response.status === 400) {
        throw new Error('Erro na formatação da requisição para IA API');
      } else if (response.status === 401) {
        throw new Error('Chave da API de IA inválida');
      } else if (response.status === 429) {
        throw new Error('Limite de requisições atingido. Tente novamente em alguns minutos');
      } else {
        throw new Error(`Falha na comunicação com IA API: ${response.status}`);
      }
    }

    // Se streaming está habilitado, retornar Server-Sent Events
    if (streaming && response.body) {
      console.log('=== STREAMING RESPONSE ===');
      
      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          
          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) break;
              
              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  
                  if (data === '[DONE]') {
                    controller.close();
                    return;
                  }
                  
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.delta?.text) {
                      // Enviar chunk de texto para o frontend
                      controller.enqueue(`data: ${JSON.stringify({ 
                        type: 'content',
                        text: parsed.delta.text 
                      })}\n\n`);
                    }
                  } catch (e) {
                    // Ignorar erros de parsing de chunks
                  }
                }
              }
            }
          } catch (error) {
            console.error('Streaming error:', error);
            controller.error(error);
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

    // Resposta normal (não-streaming)
    console.log('AI API call successful');
    const data = await response.json();
    console.log('AI API response received');

    const assistantResponse = data.content[0]?.text || 'Resposta não disponível';
    
    console.log('Usage:', data.usage);
    console.log('Response content preview:', assistantResponse.substring(0, 100) + '...');

    // Calcular tokens usados
    const actualTokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
    console.log('Tokens realmente usados:', actualTokensUsed);

    // Consumir tokens se userId fornecido
    if (userId && actualTokensUsed > 0) {
      console.log('=== TOKEN CONSUMPTION ===');
      
      const { data: consumeResult, error: consumeError } = await supabase
        .rpc('consume_tokens', {
          p_user_id: userId,
          p_tokens_used: actualTokensUsed,
          p_feature_used: `chat_${agentName || 'agent'}`,
          p_prompt_tokens: data.usage?.input_tokens || Math.floor(actualTokensUsed * 0.7),
          p_completion_tokens: data.usage?.output_tokens || Math.floor(actualTokensUsed * 0.3)
        });

      if (consumeError || !consumeResult) {
        console.error('⚠️ Erro ao consumir tokens:', consumeError);
      } else {
        console.log('Tokens consumidos com sucesso');
      }

      // Verificar e enviar notificações se necessário
      const { data: tokensAfter } = await supabase
        .rpc('get_available_tokens', { p_user_id: userId });
      
      const remainingTokens = tokensAfter?.[0]?.total_available || 0;
      console.log('Verificando notificações:', { remainingTokens, usagePercentage: ((100000 - remainingTokens) / 100000) * 100 });
    }

    console.log('=== SUCCESS ===');
    console.log('Chat processado com sucesso');

    return new Response(JSON.stringify({
      response: assistantResponse,
      tokensUsed: actualTokensUsed,
      tokensRemaining: userId ? await getUserRemainingTokens(supabase, userId) : null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro no chat:', error);
    
    let statusCode = 500;
    let errorMessage = 'Erro interno do servidor';
    
    if (error.message?.includes('Tokens insuficientes')) {
      statusCode = 402;
      errorMessage = error.message;
    } else if (error.message?.includes('IA API')) {
      statusCode = 503;
      errorMessage = error.message;
    } else if (error.message?.includes('ambiente incompleta')) {
      statusCode = 503;
      errorMessage = 'Configuração do sistema incompleta';
    }

    return new Response(JSON.stringify({
      error: errorMessage,
      details: error.message
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getUserRemainingTokens(supabase: any, userId: string): Promise<number> {
  try {
    const { data } = await supabase
      .rpc('get_available_tokens', { p_user_id: userId });
    return data?.[0]?.total_available || 0;
  } catch {
    return 0;
  }
}
