

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

    console.log('=== CHAT REQUEST DEBUG ===');
    console.log('User ID:', userId);
    console.log('Agent Name:', agentName);
    console.log('Is Custom Agent:', isCustomAgent);
    console.log('Message Length:', message?.length);
    console.log('Agent Prompt Length:', agentPrompt?.length);

    // Validações básicas
    if (!message || message.trim().length === 0) {
      throw new Error('Mensagem é obrigatória');
    }

    if (!userId) {
      throw new Error('User ID é obrigatório');
    }

    if (!agentPrompt) {
      throw new Error('Prompt do agente é obrigatório');
    }

    // Verificar variáveis de ambiente
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    console.log('=== ENVIRONMENT CHECK ===');
    console.log('Supabase URL:', supabaseUrl ? 'OK' : 'MISSING');
    console.log('Supabase Key:', supabaseKey ? 'OK' : 'MISSING');
    console.log('Anthropic API Key:', anthropicApiKey ? 'OK' : 'MISSING');

    if (!supabaseUrl || !supabaseKey || !anthropicApiKey) {
      throw new Error('Configuração de ambiente incompleta. Verifique se ANTHROPIC_API_KEY está configurado.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Estimar tokens necessários ANTES da chamada (aumentado para Claude 4 Sonnet)
    const estimatedTokens = estimateTokensForChat(message, chatHistory, agentPrompt);
    console.log('Tokens estimados necessários (Claude 4 Sonnet):', estimatedTokens);

    // Verificar se o usuário tem tokens suficientes
    console.log('=== TOKEN VERIFICATION ===');
    const { data: tokensData, error: tokensError } = await supabase
      .rpc('get_available_tokens', { p_user_id: userId });

    if (tokensError) {
      console.error('Erro ao verificar tokens:', tokensError);
      throw new Error('Erro ao verificar tokens disponíveis');
    }

    const userTokens = tokensData?.[0];
    console.log('User tokens:', userTokens);
    
    if (!userTokens || userTokens.total_available < estimatedTokens) {
      console.log('Tokens insuficientes:', { available: userTokens?.total_available, needed: estimatedTokens });
      throw new Error(`Tokens insuficientes. Você tem ${userTokens?.total_available || 0} tokens disponíveis e precisa de aproximadamente ${estimatedTokens} tokens.`);
    }

    // Construir histórico para a API - CORREÇÃO PRINCIPAL: separar system prompt das mensagens
    const messages = [];
    
    // Adicionar histórico do chat se existir (SEM o system prompt)
    if (chatHistory && Array.isArray(chatHistory)) {
      for (const msg of chatHistory) {
        if (msg && msg.content && msg.role && msg.role !== 'system') {
          messages.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          });
        }
      }
    }
    
    // Adicionar mensagem atual
    messages.push({ role: "user", content: message });

    console.log('=== CLAUDE 4 SONNET API CALL ===');
    console.log('Messages count:', messages.length);
    console.log('System prompt length:', agentPrompt.length);
    console.log('Calling Claude 4 Sonnet API...');

    // Chamar Claude API com Claude 4 Sonnet
    let claudeResponse;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Tentativa ${attempts}/${maxAttempts} com Claude 4 Sonnet`);

      try {
        const requestBody = {
          model: 'claude-sonnet-4-20250514', // 🚀 ATUALIZADO PARA CLAUDE 4 SONNET
          max_tokens: 3000, // Aumentado para aproveitar melhor o Claude 4
          system: agentPrompt,
          messages: messages
        };

        console.log('Request body structure (Claude 4):', {
          model: requestBody.model,
          max_tokens: requestBody.max_tokens,
          system_length: requestBody.system?.length,
          messages_count: requestBody.messages?.length
        });

        claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicApiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(60000) // Aumentado para 60s para Claude 4
        });

        if (claudeResponse.ok) {
          console.log('Claude 4 Sonnet API call successful');
          break; // Sucesso, sair do loop
        } else {
          const errorText = await claudeResponse.text();
          console.error(`Erro Claude 4 API (tentativa ${attempts}):`, claudeResponse.status, errorText);
          
          if (attempts === maxAttempts) {
            throw new Error(`Falha na comunicação com Claude 4 Sonnet após ${maxAttempts} tentativas. Status: ${claudeResponse.status}. Erro: ${errorText}`);
          }
          
          // Aguardar um pouco antes da próxima tentativa
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      } catch (error) {
        console.error(`Erro na tentativa ${attempts} com Claude 4:`, error);
        
        if (attempts === maxAttempts) {
          throw new Error(`Falha na comunicação com Claude 4 Sonnet: ${error.message}`);
        }
        
        // Aguardar um pouco antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }

    const claudeData = await claudeResponse.json();
    console.log('Claude 4 Sonnet API response received');
    console.log('Usage:', claudeData.usage);
    console.log('Response content preview:', claudeData.content?.[0]?.text?.substring(0, 100) + '...');

    const responseContent = claudeData.content?.[0]?.text || claudeData.content || 'Resposta vazia do agente';

    // Calcular tokens reais usados
    const actualTokensUsed = claudeData.usage?.input_tokens + claudeData.usage?.output_tokens || estimatedTokens;
    console.log('Tokens realmente usados pelo Claude 4:', actualTokensUsed);

    // Consumir tokens no banco
    console.log('=== TOKEN CONSUMPTION ===');
    const { data: consumeResult, error: consumeError } = await supabase
      .rpc('consume_tokens', {
        p_user_id: userId,
        p_tokens_used: actualTokensUsed,
        p_feature_used: isCustomAgent ? 'custom_agent_chat_claude4' : 'agent_chat_claude4',
        p_prompt_tokens: claudeData.usage?.input_tokens || Math.floor(actualTokensUsed * 0.6),
        p_completion_tokens: claudeData.usage?.output_tokens || Math.floor(actualTokensUsed * 0.4)
      });

    if (consumeError || !consumeResult) {
      console.error('Erro ao consumir tokens:', consumeError);
      // Continuar mesmo com erro de consumo, mas logar
    } else {
      console.log('Tokens consumidos com sucesso (Claude 4)');
    }

    // Verificar se precisa enviar notificações
    await checkAndSendNotifications(supabase, userId, userTokens.total_available - actualTokensUsed);

    console.log('=== SUCCESS ===');
    console.log('Chat processado com sucesso usando Claude 4 Sonnet');

    return new Response(JSON.stringify({
      response: responseContent,
      tokensUsed: actualTokensUsed,
      tokensRemaining: userTokens.total_available - actualTokensUsed,
      success: true,
      model: 'claude-sonnet-4-20250514' // Informar qual modelo foi usado
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== ERROR ===');
    console.error('Erro no chat-with-claude (Claude 4):', error);
    console.error('Stack trace:', error.stack);
    
    // Retornar erro específico baseado no tipo
    let statusCode = 500;
    let errorMessage = error.message || 'Erro interno do servidor';
    
    if (error.message.includes('Tokens insuficientes')) {
      statusCode = 402;
    } else if (error.message.includes('obrigatório')) {
      statusCode = 400;
    } else if (error.message.includes('ambiente incompleta')) {
      statusCode = 503;
      errorMessage = 'Serviço temporariamente indisponível. Verifique a configuração.';
    }

    return new Response(JSON.stringify({
      error: errorMessage,
      success: false,
      details: error.stack?.split('\n').slice(0, 3).join('\n') // Primeiras 3 linhas do stack
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function estimateTokensForChat(message: string, chatHistory: any[] = [], agentPrompt: string): number {
  // Estimativa ajustada para Claude 4 Sonnet (mais conservadora)
  const messageChars = message.length;
  const historyChars = (chatHistory || []).reduce((total, msg) => total + (msg.content?.length || 0), 0);
  const promptChars = agentPrompt.length;
  
  // ~4 caracteres por token (conservador)
  const inputTokens = Math.ceil((messageChars + historyChars + promptChars) / 4);
  // Estimar resposta maior para Claude 4 (750-1000 tokens)
  const outputTokens = 1000;
  
  return inputTokens + outputTokens;
}

async function checkAndSendNotifications(supabase: any, userId: string, remainingTokens: number) {
  try {
    const MONTHLY_TOKENS = 100000; // Limite atual
    const usagePercentage = ((MONTHLY_TOKENS - remainingTokens) / MONTHLY_TOKENS) * 100;
    
    console.log('Verificando notificações:', { remainingTokens, usagePercentage });

    // Buscar perfil atual para verificar flags de notificação
    const { data: profile } = await supabase
      .from('profiles')
      .select('notified_90, notified_50, notified_10')
      .eq('id', userId)
      .single();

    let updateData: any = {};

    // Notificação 90% usado (10.000 tokens restantes)
    if (usagePercentage >= 90 && !profile?.notified_90) {
      updateData.notified_90 = true;
      console.log('Usuário atingiu 90% de uso dos tokens');
    }

    // Notificação 50% usado (50.000 tokens restantes)  
    if (usagePercentage >= 50 && !profile?.notified_50) {
      updateData.notified_50 = true;
      console.log('Usuário atingiu 50% de uso dos tokens');
    }

    // Notificação 10% restantes (90.000 tokens usados)
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
  } catch (error) {
    console.error('Erro ao verificar notificações:', error);
    // Não falhar por causa de notificações
  }
}

