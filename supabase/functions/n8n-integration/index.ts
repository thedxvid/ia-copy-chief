
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
    } else if (requestBody.briefing) {
      // Estrutura das páginas especializadas: { briefing, userId }
      console.log('🔧 Using specialized pages structure');
      const briefing = requestBody.briefing;
      productData = briefing;
      copyType = briefing.copy_type || 'specialized_copy';
      customInstructions = briefing.additional_info;
      type = 'copy_generation';
      data = requestBody;
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
    let estimatedTokens = 2500; // Tokens estimados para Claude 4 Sonnet

    if (type === 'copy_generation' && (data?.copy_type || copyType)) {
      // Nova estrutura para copies especializadas (Quiz e páginas especializadas)
      console.log('🎯 Processing specialized copy generation');
      
      if (data?.prompt) {
        prompt = data.prompt;
      } else {
        prompt = buildSpecializedCopyPrompt(data?.copy_type || copyType, data?.quiz_answers || data?.briefing || productData);
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

    console.log('🤖 Calling AI API...');

    // Chamar API de IA com a sintaxe correta
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-4-sonnet-20241022', // Claude 4 Sonnet modelo correto
        max_tokens: 4000,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ AI API error:', response.status, errorText);
      
      // Melhor tratamento de erros específicos da API
      if (response.status === 400) {
        console.error('🚨 Bad Request - Verificar sintaxe da requisição');
        throw new Error('Erro na formatação da requisição para IA API');
      } else if (response.status === 401) {
        console.error('🚨 Unauthorized - API Key inválida');
        throw new Error('Chave da API de IA inválida');
      } else if (response.status === 429) {
        console.error('🚨 Rate Limited - Muitas requisições');
        throw new Error('Limite de requisições atingido. Tente novamente em alguns minutos');
      } else {
        throw new Error(`Falha na comunicação com IA API: ${response.status}`);
      }
    }

    const aiData = await response.json();
    const generatedCopy = aiData.content[0]?.text || 'Copy não gerada';

    console.log('✅ Copy generated successfully, length:', generatedCopy.length);

    // Calcular tokens reais usados
    const actualTokensUsed = aiData.usage?.input_tokens + aiData.usage?.output_tokens || estimatedTokens;
    console.log('📊 Actual tokens used:', actualTokensUsed);

    // Consumir tokens
    const { data: consumeResult, error: consumeError } = await supabase
      .rpc('consume_tokens', {
        p_user_id: userId,
        p_tokens_used: actualTokensUsed,
        p_feature_used: `copy_generation_${data?.copy_type || copyType}`,
        p_prompt_tokens: aiData.usage?.input_tokens || Math.floor(actualTokensUsed * 0.4),
        p_completion_tokens: aiData.usage?.output_tokens || Math.floor(actualTokensUsed * 0.6)
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
    console.error('💥 Error in copy generation:', error);
    
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
  // Estimativas ajustadas para Claude 4 Sonnet
  const estimates: { [key: string]: number } = {
    'vsl': 4000,
    'sales_video': 4000,
    'ads': 2000,
    'landing_page': 3000,
    'landing': 3000,
    'email': 2500,
    'product': 3000,
    'page': 3000,
    'content': 2500,
    'specialized_copy': 3000
  };
  
  return estimates[copyType] || 2500;
}

function buildSpecializedCopyPrompt(copyType: string, briefingData: any): string {
  console.log('🏗️ Building specialized prompt for:', copyType);
  console.log('📋 Briefing data:', briefingData);
  
  // Se já tem um prompt construído, usar ele
  if (briefingData?.prompt) {
    return briefingData.prompt;
  }
  
  // Construir prompt baseado nas respostas do quiz ou briefing
  const answers = briefingData || {};
  
  // Extrair informações principais do briefing
  const productName = answers.product_name || answers.product || 'produto/serviço';
  const benefits = answers.product_benefits || answers.benefits || 'benefícios do produto';
  const audience = answers.target_audience || answers.target || 'público-alvo';
  const tone = answers.tone || 'profissional';
  const objective = answers.objective || 'conversão';
  
  // Construir texto das informações
  const answersText = Object.entries(answers)
    .filter(([key, value]) => value && key !== 'prompt')
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  const typePrompts = {
    'vsl': `Crie um roteiro completo de VSL (Video Sales Letter) para ${productName}.

INFORMAÇÕES DO BRIEFING:
${answersText}

ESTRUTURA OBRIGATÓRIA:
1. HOOK (30-60 segundos) - Prenda a atenção imediatamente
2. APRESENTAÇÃO - Credibilidade e autoridade
3. PROBLEMA - Identifique a dor do cliente
4. AGITAÇÃO - Amplifique o problema
5. SOLUÇÃO - Apresente o produto como solução
6. BENEFÍCIOS - Liste benefícios específicos
7. PROVA SOCIAL - Depoimentos e resultados
8. OFERTA - Detalhe a proposta de valor
9. URGÊNCIA/ESCASSEZ - Crie senso de urgência
10. CTA FINAL - Call to action claro e persuasivo

Tom: ${tone}
Objetivo: ${objective}`,

    'sales_video': `Crie um roteiro completo de VSL (Video Sales Letter) para ${productName}.

INFORMAÇÕES DO BRIEFING:
${answersText}

ESTRUTURA OBRIGATÓRIA:
1. HOOK (30-60 segundos) - Prenda a atenção imediatamente
2. APRESENTAÇÃO - Credibilidade e autoridade
3. PROBLEMA - Identifique a dor do cliente
4. AGITAÇÃO - Amplifique o problema
5. SOLUÇÃO - Apresente o produto como solução
6. BENEFÍCIOS - Liste benefícios específicos
7. PROVA SOCIAL - Depoimentos e resultados
8. OFERTA - Detalhe a proposta de valor
9. URGÊNCIA/ESCASSEZ - Crie senso de urgência
10. CTA FINAL - Call to action claro e persuasivo

Tom: ${tone}
Objetivo: ${objective}`,

    'product': `Crie uma estrutura de oferta completa para ${productName}.

INFORMAÇÕES DO BRIEFING:
${answersText}

ESTRUTURA OBRIGATÓRIA:
1. PROPOSTA DE VALOR - Headlines impactantes
2. BENEFÍCIOS PRINCIPAIS - O que o cliente ganha
3. COMO FUNCIONA - Processo ou metodologia
4. BÔNUS EXCLUSIVOS - Itens de valor agregado
5. GARANTIA - Política de satisfação
6. URGÊNCIA - Limitação de tempo/vagas
7. PREÇO E CONDIÇÕES - Apresentação da oferta
8. CTA PERSUASIVO - Chamada para ação

Tom: ${tone}
Foco: ${audience}`,

    'landing': `Crie uma copy completa para landing page de ${productName}.

INFORMAÇÕES DO BRIEFING:
${answersText}

ESTRUTURA OBRIGATÓRIA:
1. HEADLINE PRINCIPAL - Promessa clara e impactante
2. SUBHEADLINE - Apoio e clarificação
3. BENEFÍCIOS - Lista de vantagens específicas
4. COMO FUNCIONA - Processo simplificado
5. PROVA SOCIAL - Depoimentos e números
6. OBJEÇÕES - Antecipe e responda dúvidas
7. GARANTIA - Reduza o risco percebido
8. CTA PRINCIPAL - Botão de conversão otimizado

Tom: ${tone}
Público: ${audience}`,

    'landing_page': `Crie uma copy completa para landing page de ${productName}.

INFORMAÇÕES DO BRIEFING:
${answersText}

ESTRUTURA OBRIGATÓRIA:
1. HEADLINE PRINCIPAL - Promessa clara e impactante
2. SUBHEADLINE - Apoio e clarificação
3. BENEFÍCIOS - Lista de vantagens específicas
4. COMO FUNCIONA - Processo simplificado
5. PROVA SOCIAL - Depoimentos e números
6. OBJEÇÕES - Antecipe e responda dúvidas
7. GARANTIA - Reduza o risco percebido
8. CTA PRINCIPAL - Botão de conversão otimizado

Tom: ${tone}
Público: ${audience}`,

    'page': `Crie uma copy completa para página de ${productName}.

INFORMAÇÕES DO BRIEFING:
${answersText}

ESTRUTURA OBRIGATÓRIA:
1. HEADLINE PRINCIPAL - Promessa clara e impactante
2. SUBHEADLINE - Apoio e clarificação
3. BENEFÍCIOS - Lista de vantagens específicas
4. COMO FUNCIONA - Processo simplificado
5. PROVA SOCIAL - Depoimentos e números
6. OBJEÇÕES - Antecipe e responda dúvidas
7. GARANTIA - Reduza o risco percebido
8. CTA PRINCIPAL - Botão de conversão otimizado

Tom: ${tone}
Público: ${audience}`,

    'ads': `Crie múltiplas variações de anúncios pagos para ${productName}.

INFORMAÇÕES DO BRIEFING:
${answersText}

ESTRUTURA OBRIGATÓRIA:
1. VARIAÇÃO 1 - Foco no problema
   - Headline impactante
   - Corpo do anúncio
   - CTA específico
   
2. VARIAÇÃO 2 - Foco na solução
   - Headline diferente
   - Corpo do anúncio
   - CTA específico
   
3. VARIAÇÃO 3 - Foco no benefício
   - Headline única
   - Corpo do anúncio  
   - CTA específico

Tom: ${tone}
Público: ${audience}`,

    'email': `Crie uma sequência de email marketing para ${productName}.

INFORMAÇÕES DO BRIEFING:
${answersText}

ESTRUTURA OBRIGATÓRIA:
1. EMAIL 1 - Boas-vindas
   - Assunto persuasivo
   - Conteúdo de apresentação
   - CTA suave
   
2. EMAIL 2 - Educacional/Valor
   - Assunto curioso
   - Conteúdo que agrega valor
   - CTA de engajamento
   
3. EMAIL 3 - Conversão
   - Assunto urgente
   - Oferta principal
   - CTA de conversão

Tom: ${tone}
Público: ${audience}`,

    'content': `Crie conteúdo para ${productName}.

INFORMAÇÕES DO BRIEFING:
${answersText}

ESTRUTURA OBRIGATÓRIA:
1. TÍTULO/ASSUNTO - Atrativo e otimizado
2. INTRODUÇÃO - Hook inicial
3. DESENVOLVIMENTO - Conteúdo principal de valor
4. CONCLUSÃO - Síntese e direcionamento
5. CTA - Chamada para ação
6. HASHTAGS - Relevantes para o nicho (se aplicável)

Tom: ${tone}
Público: ${audience}`,

    'specialized_copy': `Crie uma copy especializada para ${productName}.

INFORMAÇÕES DO BRIEFING:
${answersText}

ESTRUTURA BÁSICA:
1. HEADLINE - Chamada principal
2. CONTEÚDO - Desenvolvimento persuasivo
3. BENEFÍCIOS - Vantagens claras
4. CTA - Chamada para ação

Tom: ${tone}
Público: ${audience}`
  };

  return typePrompts[copyType as keyof typeof typePrompts] || 
         `Crie uma copy profissional para ${productName} baseada nas seguintes informações:\n\n${answersText}\n\nTom: ${tone}\nPúblico: ${audience}\nObjetivo: ${objective}`;
}

function estimateTokensForCopy(copyType: string, productData: any, customInstructions?: string): number {
  // Estimativas baseadas no tipo de copy para Claude 4 Sonnet
  const baseEstimates: { [key: string]: number } = {
    'landing_page': 3000,
    'email_sequence': 2500,
    'social_media': 1500,
    'vsl_script': 4000,
    'telegram_copy': 2000,
    'whatsapp_copy': 1500,
    'ad_copy': 1200
  };

  let baseTokens = baseEstimates[copyType] || 2000;

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
