
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
    const { message, agentPrompt, chatHistory, agentName, isCustomAgent, userId } = await req.json();

    console.log('Chat request received:', { userId, agentName, messageLength: message?.length });

    if (!userId) {
      throw new Error('User ID é obrigatório');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!supabaseUrl || !supabaseKey || !anthropicApiKey) {
      throw new Error('Configuração de ambiente incompleta');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Estimar tokens necessários ANTES da chamada
    const estimatedTokens = estimateTokensForChat(message, chatHistory, agentPrompt);
    console.log('Tokens estimados necessários:', estimatedTokens);

    // Verificar se o usuário tem tokens suficientes
    const { data: tokensData, error: tokensError } = await supabase
      .rpc('get_available_tokens', { p_user_id: userId });

    if (tokensError) {
      console.error('Erro ao verificar tokens:', tokensError);
      throw new Error('Erro ao verificar tokens disponíveis');
    }

    const userTokens = tokensData?.[0];
    if (!userTokens || userTokens.total_available < estimatedTokens) {
      console.log('Tokens insuficientes:', { available: userTokens?.total_available, needed: estimatedTokens });
      throw new Error(`Tokens insuficientes. Você tem ${userTokens?.total_available || 0} tokens disponíveis e precisa de aproximadamente ${estimatedTokens} tokens.`);
    }

    // Construir histórico para a API
    const messages = [
      { role: "system", content: agentPrompt },
      ...(chatHistory || []).map((msg: any) => ({
        role: msg.role === 'user' ? 'human' : 'assistant',
        content: msg.content
      })),
      { role: "human", content: message }
    ];

    console.log('Chamando Claude API...');

    // Chamar Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        messages: messages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da Claude API:', response.status, errorText);
      throw new Error('Falha na comunicação com Claude API');
    }

    const claudeData = await response.json();
    const responseContent = claudeData.content[0]?.text || 'Resposta vazia';

    // Calcular tokens reais usados
    const actualTokensUsed = claudeData.usage?.input_tokens + claudeData.usage?.output_tokens || estimatedTokens;
    console.log('Tokens realmente usados:', actualTokensUsed);

    // Consumir tokens no banco
    const { data: consumeResult, error: consumeError } = await supabase
      .rpc('consume_tokens', {
        p_user_id: userId,
        p_tokens_used: actualTokensUsed,
        p_feature_used: isCustomAgent ? 'custom_agent_chat' : 'agent_chat',
        p_prompt_tokens: claudeData.usage?.input_tokens || Math.floor(actualTokensUsed * 0.6),
        p_completion_tokens: claudeData.usage?.output_tokens || Math.floor(actualTokensUsed * 0.4)
      });

    if (consumeError || !consumeResult) {
      console.error('Erro ao consumir tokens:', consumeError);
      // Continuar mesmo com erro de consumo, mas logar
    }

    // Verificar se precisa enviar notificações
    await checkAndSendNotifications(supabase, userId, userTokens.total_available - actualTokensUsed);

    console.log('Chat processado com sucesso');

    return new Response(JSON.stringify({
      response: responseContent,
      tokensUsed: actualTokensUsed,
      tokensRemaining: userTokens.total_available - actualTokensUsed
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro no chat-with-claude:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Erro interno do servidor'
    }), {
      status: error.message.includes('Tokens insuficientes') ? 402 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function estimateTokensForChat(message: string, chatHistory: any[] = [], agentPrompt: string): number {
  // Estimativa conservadora baseada em caracteres
  const messageChars = message.length;
  const historyChars = (chatHistory || []).reduce((total, msg) => total + (msg.content?.length || 0), 0);
  const promptChars = agentPrompt.length;
  
  // ~4 caracteres por token (conservador)
  const inputTokens = Math.ceil((messageChars + historyChars + promptChars) / 4);
  // Estimar resposta de ~500 tokens
  const outputTokens = 500;
  
  return inputTokens + outputTokens;
}

async function checkAndSendNotifications(supabase: any, userId: string, remainingTokens: number) {
  const MONTHLY_TOKENS = 25000; // Novo limite para plano R$ 97
  const usagePercentage = ((MONTHLY_TOKENS - remainingTokens) / MONTHLY_TOKENS) * 100;
  
  console.log('Verificando notificações:', { remainingTokens, usagePercentage });

  // Buscar perfil atual para verificar flags de notificação
  const { data: profile } = await supabase
    .from('profiles')
    .select('notified_90, notified_50, notified_10')
    .eq('id', userId)
    .single();

  let updateData: any = {};

  // Notificação 90% usado (2.500 tokens restantes)
  if (usagePercentage >= 90 && !profile?.notified_90) {
    updateData.notified_90 = true;
    console.log('Usuário atingiu 90% de uso dos tokens');
  }

  // Notificação 50% usado (12.500 tokens restantes)  
  if (usagePercentage >= 50 && !profile?.notified_50) {
    updateData.notified_50 = true;
    console.log('Usuário atingiu 50% de uso dos tokens');
  }

  // Notificação 10% restantes (22.500 tokens usados)
  if (usagePercentage >= 90 && !profile?.notified_10) {
    updateData.notified_10 = true;
    console.log('Usuário tem apenas 10% dos tokens restantes');
  }

  // Atualizar flags se necessário
  if (Object.keys(updateData).length > 0) {
    await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);
  }
}
