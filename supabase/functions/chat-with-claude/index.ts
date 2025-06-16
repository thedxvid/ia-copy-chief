
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
    const { message, agentPrompt, agentName, isCustomAgent, userId, streaming = false } = await req.json();

    console.log('=== CHAT REQUEST DEBUG ===');
    console.log('User ID:', userId);
    console.log('Agent Name:', agentName);
    console.log('Is Custom Agent:', isCustomAgent);
    console.log('Message Length:', message?.length || 0);
    console.log('Agent Prompt Length:', agentPrompt?.length || 0);
    console.log('Streaming enabled:', streaming);
    console.log('Request timestamp:', new Date().toISOString());

    // Validate required parameters
    if (!message || !agentPrompt || !agentName) {
      console.error('❌ Missing required parameters:', {
        hasMessage: !!message,
        hasAgentPrompt: !!agentPrompt,
        hasAgentName: !!agentName
      });
      return new Response(JSON.stringify({
        error: 'Parâmetros obrigatórios ausentes',
        details: 'message, agentPrompt e agentName são obrigatórios',
        response: 'Erro: Parâmetros inválidos. Tente novamente.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    console.log('=== ENVIRONMENT CHECK ===');
    console.log('Supabase URL:', supabaseUrl ? 'OK' : 'MISSING');
    console.log('Supabase Key:', supabaseKey ? 'OK' : 'MISSING');
    console.log('Anthropic API Key:', anthropicApiKey ? 'OK' : 'MISSING');

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase configuration missing');
      return new Response(JSON.stringify({
        error: 'Configuração do Supabase incompleta',
        response: 'Erro de configuração do servidor. Contate o suporte.'
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!anthropicApiKey) {
      console.error('❌ Anthropic API key missing');
      return new Response(JSON.stringify({
        error: 'Chave da API Anthropic não configurada',
        response: 'Serviço de IA temporariamente indisponível. Tente novamente mais tarde.'
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar tokens disponíveis se userId fornecido
    if (userId) {
      console.log('=== TOKEN VERIFICATION ===');
      
      try {
        const { data: tokensData, error: tokensError } = await supabase
          .rpc('get_available_tokens', { p_user_id: userId });

        if (tokensError) {
          console.error('❌ Erro ao verificar tokens:', tokensError);
          return new Response(JSON.stringify({
            error: 'Erro ao verificar tokens disponíveis',
            response: 'Não foi possível verificar seus tokens. Tente novamente.'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const userTokens = tokensData?.[0];
        console.log('User tokens:', userTokens);

        // Estimar tokens necessários para Claude
        const systemPromptLength = agentPrompt?.length || 0;
        const messageLength = message.length;
        
        const estimatedTokens = Math.ceil((systemPromptLength + messageLength) * 1.3) + 1000; // Buffer para resposta
        console.log('Tokens estimados necessários:', estimatedTokens);

        if (!userTokens || userTokens.total_available < estimatedTokens) {
          console.error('❌ Tokens insuficientes:', {
            available: userTokens?.total_available || 0,
            needed: estimatedTokens
          });
          return new Response(JSON.stringify({
            error: 'Tokens insuficientes',
            response: `Tokens insuficientes. Você tem ${userTokens?.total_available || 0} tokens disponíveis e precisa de aproximadamente ${estimatedTokens} tokens para esta conversa.`
          }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (tokenError) {
        console.error('❌ Erro na verificação de tokens:', tokenError);
        return new Response(JSON.stringify({
          error: 'Erro na verificação de tokens',
          response: 'Não foi possível verificar seus tokens. Tente novamente.'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Preparar mensagens para Claude
    const messages = [{
      role: 'user',
      content: message
    }];

    console.log('=== CLAUDE API CALL ===');
    console.log('Messages count:', messages.length);
    console.log('System prompt length:', agentPrompt?.length || 0);

    const requestBody = {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
      system: agentPrompt || `Você é ${agentName || 'um assistente útil'}. Responda de forma clara, direta e útil.`,
      messages: messages,
      stream: false // Desabilitar streaming temporariamente para debug
    };

    console.log('Request body structure (Claude):', {
      model: requestBody.model,
      max_tokens: requestBody.max_tokens,
      system_length: requestBody.system.length,
      messages_count: requestBody.messages.length,
      stream: requestBody.stream
    });

    console.log('Calling Claude API...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Claude API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Claude API error:', response.status, errorText);
      
      let errorMessage = 'Erro na comunicação com a IA';
      if (response.status === 400) {
        errorMessage = 'Erro na formatação da requisição para Claude API';
      } else if (response.status === 401) {
        errorMessage = 'Chave da API Claude inválida';
      } else if (response.status === 429) {
        errorMessage = 'Limite de requisições atingido. Tente novamente em alguns minutos';
      }

      return new Response(JSON.stringify({
        error: errorMessage,
        response: 'Desculpe, houve um problema com o serviço de IA. Tente novamente em alguns instantes.'
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resposta normal (não-streaming)
    console.log('Claude API call successful');
    const data = await response.json();
    console.log('Claude API response received:', {
      hasContent: !!data.content,
      contentLength: data.content?.[0]?.text?.length || 0,
      usage: data.usage
    });

    const assistantResponse = data.content?.[0]?.text || 'Resposta não disponível';
    
    if (!assistantResponse || assistantResponse.trim() === '') {
      console.error('❌ Resposta vazia do Claude');
      return new Response(JSON.stringify({
        error: 'Resposta vazia da IA',
        response: 'A IA não conseguiu gerar uma resposta. Tente reformular sua pergunta.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Response content preview:', assistantResponse.substring(0, 100) + '...');

    // Calcular tokens usados
    const actualTokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
    console.log('Tokens realmente usados pelo Claude:', actualTokensUsed);

    // Consumir tokens se userId fornecido
    if (userId && actualTokensUsed > 0) {
      console.log('=== TOKEN CONSUMPTION ===');
      
      try {
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
          console.log('✅ Tokens consumidos com sucesso');
        }
      } catch (tokenConsumeError) {
        console.error('⚠️ Erro na consumição de tokens:', tokenConsumeError);
      }
    }

    console.log('=== SUCCESS ===');
    console.log('Chat processado com sucesso usando Claude');

    return new Response(JSON.stringify({
      response: assistantResponse,
      tokensUsed: actualTokensUsed,
      tokensRemaining: userId ? await getUserRemainingTokens(supabase, userId) : null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro geral no chat:', error);
    
    return new Response(JSON.stringify({
      error: 'Erro interno do servidor',
      details: error.message,
      response: 'Ocorreu um erro inesperado. Tente novamente ou contate o suporte se o problema persistir.'
    }), {
      status: 500,
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
