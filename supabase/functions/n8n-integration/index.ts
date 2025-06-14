
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
    const { 
      productData, 
      copyType, 
      customInstructions,
      userId 
    } = await req.json();

    console.log('Copy generation request:', { userId, copyType, productName: productData?.name });

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

    // Estimar tokens necessários para geração de copy
    const estimatedTokens = estimateTokensForCopy(copyType, productData, customInstructions);
    console.log('Tokens estimados para copy:', estimatedTokens);

    // Verificar tokens disponíveis
    const { data: tokensData, error: tokensError } = await supabase
      .rpc('get_available_tokens', { p_user_id: userId });

    if (tokensError) {
      console.error('Erro ao verificar tokens:', tokensError);
      throw new Error('Erro ao verificar tokens disponíveis');
    }

    const userTokens = tokensData?.[0];
    if (!userTokens || userTokens.total_available < estimatedTokens) {
      console.log('Tokens insuficientes para copy:', { available: userTokens?.total_available, needed: estimatedTokens });
      throw new Error(`Tokens insuficientes. Você tem ${userTokens?.total_available || 0} tokens disponíveis e precisa de aproximadamente ${estimatedTokens} tokens para gerar esta copy.`);
    }

    // Construir prompt baseado no tipo de copy
    const prompt = buildCopyPrompt(copyType, productData, customInstructions);

    console.log('Gerando copy com Claude...');

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
        max_tokens: 3000, // Mais tokens para copy longa
        messages: [
          { role: 'human', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da Claude API:', response.status, errorText);
      throw new Error('Falha na comunicação com Claude API');
    }

    const claudeData = await response.json();
    const generatedCopy = claudeData.content[0]?.text || 'Copy não gerada';

    // Calcular tokens reais usados
    const actualTokensUsed = claudeData.usage?.input_tokens + claudeData.usage?.output_tokens || estimatedTokens;
    console.log('Tokens realmente usados para copy:', actualTokensUsed);

    // Consumir tokens
    const { data: consumeResult, error: consumeError } = await supabase
      .rpc('consume_tokens', {
        p_user_id: userId,
        p_tokens_used: actualTokensUsed,
        p_feature_used: `copy_generation_${copyType}`,
        p_prompt_tokens: claudeData.usage?.input_tokens || Math.floor(actualTokensUsed * 0.4),
        p_completion_tokens: claudeData.usage?.output_tokens || Math.floor(actualTokensUsed * 0.6)
      });

    if (consumeError || !consumeResult) {
      console.error('Erro ao consumir tokens:', consumeError);
    }

    // Verificar notificações
    await checkAndSendNotifications(supabase, userId, userTokens.total_available - actualTokensUsed);

    console.log('Copy gerada com sucesso');

    return new Response(JSON.stringify({
      generatedCopy,
      tokensUsed: actualTokensUsed,
      tokensRemaining: userTokens.total_available - actualTokensUsed,
      copyType
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro no n8n-integration:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Erro interno do servidor'
    }), {
      status: error.message.includes('Tokens insuficientes') ? 402 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function estimateTokensForCopy(copyType: string, productData: any, customInstructions?: string): number {
  // Estimativas baseadas no tipo de copy
  const baseEstimates: { [key: string]: number } = {
    'landing_page': 2500,
    'email_sequence': 2000,
    'social_media': 1000,
    'vsl_script': 3000,
    'telegram_copy': 1500,
    'whatsapp_copy': 1200,
    'ad_copy': 800
  };

  let baseTokens = baseEstimates[copyType] || 1500;

  // Ajustar baseado no tamanho dos dados do produto
  const productDataSize = JSON.stringify(productData || {}).length;
  const instructionsSize = (customInstructions || '').length;
  
  // Adicionar ~25% para produtos complexos
  if (productDataSize > 2000 || instructionsSize > 500) {
    baseTokens = Math.floor(baseTokens * 1.25);
  }

  return baseTokens;
}

function buildCopyPrompt(copyType: string, productData: any, customInstructions?: string): string {
  const basePrompt = `Você é um copywriter expert. Gere uma copy ${copyType} profissional e persuasiva para:

PRODUTO: ${productData?.name || 'Produto'}
NICHO: ${productData?.niche || 'Geral'}
SUB-NICHO: ${productData?.sub_niche || 'N/A'}

DADOS DO PRODUTO:
${JSON.stringify(productData, null, 2)}

${customInstructions ? `INSTRUÇÕES ESPECÍFICAS: ${customInstructions}` : ''}

Gere uma copy completa, profissional e otimizada para conversão.`;

  return basePrompt;
}

async function checkAndSendNotifications(supabase: any, userId: string, remainingTokens: number) {
  const MONTHLY_TOKENS = 25000;
  const usagePercentage = ((MONTHLY_TOKENS - remainingTokens) / MONTHLY_TOKENS) * 100;
  
  console.log('Verificando notificações copy:', { remainingTokens, usagePercentage });

  const { data: profile } = await supabase
    .from('profiles')
    .select('notified_90, notified_50, notified_10')
    .eq('id', userId)
    .single();

  let updateData: any = {};

  if (usagePercentage >= 90 && !profile?.notified_90) {
    updateData.notified_90 = true;
  }

  if (usagePercentage >= 50 && !profile?.notified_50) {
    updateData.notified_50 = true;
  }

  if (usagePercentage >= 90 && !profile?.notified_10) {
    updateData.notified_10 = true;
  }

  if (Object.keys(updateData).length > 0) {
    await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);
  }
}
