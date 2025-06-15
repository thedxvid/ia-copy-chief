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
    const requestBody = await req.json();
    console.log('🔍 Raw request body received:', JSON.stringify(requestBody, null, 2));

    // Extrair userId de diferentes estruturas possíveis
    let userId = requestBody.userId || requestBody.user_id;
    
    // Extrair dados da requisição com compatibilidade para ambas as estruturas
    let copyType, productData, customInstructions, type, data;
    
    if (requestBody.type && requestBody.data) {
      // Nova estrutura do Quiz: { type, user_id, data }
      console.log('📋 Using Quiz structure');
      type = requestBody.type;
      data = requestBody.data;
      copyType = data.copy_type || requestBody.type;
      
      // Para o Quiz, os dados estão em requestBody.data
      productData = {
        quiz_answers: data.quiz_answers || data.briefing,
        copy_type: data.copy_type,
        prompt: data.prompt,
        target_audience: data.target_audience || data.quiz_answers?.target,
        product_info: data.product_info || data.quiz_answers?.product
      };
    } else {
      // Estrutura antiga das outras ferramentas: { userId, copyType, productData, customInstructions }
      console.log('🔧 Using legacy structure');
      productData = requestBody.productData;
      copyType = requestBody.copyType;
      customInstructions = requestBody.customInstructions;
      type = 'copy_generation';
      data = requestBody;
    }

    console.log('👤 Extracted userId:', userId);
    console.log('📝 Copy type:', copyType);
    console.log('📦 Product data:', JSON.stringify(productData, null, 2));

    // Validação crítica do userId
    if (!userId) {
      console.error('❌ CRITICAL: No userId found in request');
      console.log('Available fields:', Object.keys(requestBody));
      throw new Error('User ID é obrigatório');
    }

    // Validação do tipo de operação
    if (!type) {
      console.error('❌ CRITICAL: No operation type found');
      throw new Error('Tipo de operação é obrigatório');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!supabaseUrl || !supabaseKey || !anthropicApiKey) {
      console.error('❌ Missing environment variables');
      throw new Error('Configuração de ambiente incompleta');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Determinar prompt baseado no tipo de requisição
    let prompt = '';
    let estimatedTokens = 1500;

    if (type === 'copy_generation' && (data?.copy_type || copyType)) {
      // Nova estrutura para copies especializadas (Quiz)
      console.log('🎯 Processing specialized copy generation');
      
      if (data?.prompt) {
        prompt = data.prompt;
      } else {
        prompt = buildSpecializedCopyPrompt(data?.copy_type || copyType, data?.quiz_answers || productData);
      }
      
      estimatedTokens = estimateSpecializedTokens(data?.copy_type || copyType);
    } else {
      // Estrutura antiga para compatibilidade (outras ferramentas)
      console.log('🔄 Processing legacy copy generation');
      prompt = buildCopyPrompt(copyType, productData, customInstructions);
      estimatedTokens = estimateTokensForCopy(copyType, productData, customInstructions);
    }

    console.log('💭 Generated prompt length:', prompt.length);
    console.log('🎯 Estimated tokens:', estimatedTokens);

    // Verificar tokens disponíveis
    console.log('🔍 Checking available tokens for user:', userId);
    const { data: tokensData, error: tokensError } = await supabase
      .rpc('get_available_tokens', { p_user_id: userId });

    if (tokensError) {
      console.error('❌ Error checking tokens:', tokensError);
      throw new Error('Erro ao verificar tokens disponíveis');
    }

    const userTokens = tokensData?.[0];
    console.log('💰 User tokens data:', userTokens);
    
    if (!userTokens || userTokens.total_available < estimatedTokens) {
      console.log('💸 Insufficient tokens:', { 
        available: userTokens?.total_available, 
        needed: estimatedTokens 
      });
      throw new Error(`Tokens insuficientes. Você tem ${userTokens?.total_available || 0} tokens disponíveis e precisa de aproximadamente ${estimatedTokens} tokens para gerar esta copy.`);
    }

    console.log('🤖 Calling Claude API...');

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
        max_tokens: 3000,
        messages: [
          { role: 'human', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Claude API error:', response.status, errorText);
      throw new Error('Falha na comunicação com Claude API');
    }

    const claudeData = await response.json();
    const generatedCopy = claudeData.content[0]?.text || 'Copy não gerada';

    console.log('✅ Copy generated successfully, length:', generatedCopy.length);

    // Calcular tokens reais usados
    const actualTokensUsed = claudeData.usage?.input_tokens + claudeData.usage?.output_tokens || estimatedTokens;
    console.log('📊 Actual tokens used:', actualTokensUsed);

    // Consumir tokens
    const { data: consumeResult, error: consumeError } = await supabase
      .rpc('consume_tokens', {
        p_user_id: userId,
        p_tokens_used: actualTokensUsed,
        p_feature_used: `copy_generation_${data?.copy_type || copyType}`,
        p_prompt_tokens: claudeData.usage?.input_tokens || Math.floor(actualTokensUsed * 0.4),
        p_completion_tokens: claudeData.usage?.output_tokens || Math.floor(actualTokensUsed * 0.6)
      });

    if (consumeError || !consumeResult) {
      console.error('⚠️ Error consuming tokens:', consumeError);
    } else {
      console.log('✅ Tokens consumed successfully');
    }

    // Verificar notificações
    await checkAndSendNotifications(supabase, userId, userTokens.total_available - actualTokensUsed);

    console.log('🎉 Copy generation completed successfully');

    return new Response(JSON.stringify({
      generatedCopy,
      tokensUsed: actualTokensUsed,
      tokensRemaining: userTokens.total_available - actualTokensUsed,
      copyType: data?.copy_type || copyType
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Error in n8n-integration:', error);
    
    // Log detalhado para debugging
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    return new Response(JSON.stringify({
      error: error.message || 'Erro interno do servidor',
      details: error.name || 'Unknown error'
    }), {
      status: error.message.includes('Tokens insuficientes') ? 402 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function estimateSpecializedTokens(copyType: string): number {
  const estimates: { [key: string]: number } = {
    'vsl': 3000,
    'ads': 1500,
    'landing_page': 2500,
    'email': 2000,
    'product': 2200,
    'landing': 2500
  };
  
  return estimates[copyType] || 2000;
}

function buildSpecializedCopyPrompt(copyType: string, briefingData: any): string {
  console.log('🏗️ Building specialized prompt for:', copyType);
  console.log('📋 Briefing data:', briefingData);
  
  // Se já tem um prompt construído, usar ele
  if (briefingData?.prompt) {
    return briefingData.prompt;
  }
  
  // Construir prompt baseado nas respostas do quiz
  const answers = briefingData || {};
  const answersText = Object.entries(answers)
    .filter(([key, value]) => value && key !== 'prompt')
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  const typePrompts = {
    'vsl': `Crie um roteiro completo de VSL (Video Sales Letter) baseado nas seguintes informações:\n\n${answersText}\n\nEstruture em: Hook, Desenvolvimento (problema/agitação/solução), Oferta e CTA final.`,
    'product': `Crie uma estrutura de oferta completa baseada nas seguintes informações:\n\n${answersText}\n\nInclua: Proposta de valor, benefícios, bônus, garantia e urgência.`,
    'landing': `Crie uma copy completa para landing page baseada nas seguintes informações:\n\n${answersText}\n\nInclua: Headline, subheadline, benefícios, prova social e CTA.`,
    'landing_page': `Crie uma copy completa para landing page baseada nas seguintes informações:\n\n${answersText}\n\nInclua: Headline, subheadline, benefícios, prova social e CTA.`,
    'ads': `Crie múltiplas variações de anúncios pagos baseado nas seguintes informações:\n\n${answersText}\n\nGere pelo menos 3 variações com diferentes abordagens.`,
    'email': `Crie uma sequência de email marketing baseada nas seguintes informações:\n\n${answersText}\n\nInclua: Emails de boas-vindas, educacionais e de conversão.`
  };

  return typePrompts[copyType as keyof typeof typePrompts] || 
         `Crie uma copy profissional baseada nas seguintes informações:\n\n${answersText}`;
}

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
  
  console.log('🔔 Checking notifications:', { remainingTokens, usagePercentage });

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
