
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface N8nRequest {
  type: 'copy_generation' | 'performance_analysis' | 'user_action' | 'chat_response';
  user_id: string;
  data: any;
  workflow_id?: string;
  session_id?: string;
}

interface CopyGenerationData {
  quiz_answers: Record<string, any>;
  copy_type: 'vsl' | 'landing_page' | 'ads' | 'email';
  target_audience: string;
  product_info: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Função para estimar tokens baseado no tipo de copy
function estimateCopyTokens(copyType: string, quizAnswers: Record<string, any>): number {
  const baseTokens = {
    'vsl': 4000,
    'landing_page': 3000,
    'ads': 1500,
    'email': 2500
  };
  
  const complexity = Object.keys(quizAnswers).length;
  const complexityMultiplier = Math.max(1, complexity / 10);
  
  return Math.ceil((baseTokens[copyType as keyof typeof baseTokens] || 3000) * complexityMultiplier);
}

// Função para contar tokens da resposta
function countResponseTokens(content: string): number {
  return Math.ceil(content.length / 4);
}

async function generateCopyWithClaude(data: CopyGenerationData, userId: string): Promise<string> {
  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
  
  if (!anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY não configurada');
  }

  // **NOVA FUNCIONALIDADE: VERIFICAR TOKENS ANTES DA GERAÇÃO**
  const estimatedTokens = estimateCopyTokens(data.copy_type, data.quiz_answers);
  
  console.log(`Verificando tokens para copy generation. Estimativa: ${estimatedTokens} tokens`);
  
  // Verificar se usuário tem tokens suficientes
  const { data: tokenData, error: tokenError } = await supabase
    .rpc('get_available_tokens', { p_user_id: userId });
  
  if (tokenError) {
    console.error('Erro ao verificar tokens:', tokenError);
    throw new Error('Erro ao verificar tokens disponíveis');
  }
  
  if (!tokenData || tokenData.length === 0) {
    throw new Error('Dados de tokens não encontrados');
  }
  
  const availableTokens = tokenData[0].total_available;
  console.log(`Tokens disponíveis: ${availableTokens}`);
  
  if (availableTokens < estimatedTokens) {
    throw new Error(`Tokens insuficientes: você precisa de ${estimatedTokens} tokens, mas tem apenas ${availableTokens} disponíveis.`);
  }

  const prompts = {
    vsl: `Você é um especialista em VSL (Video Sales Letter) que criou roteiros que geraram milhões em vendas.

OBJETIVO: Criar um roteiro de VSL persuasivo baseado nas informações fornecidas.

ESTRUTURA OBRIGATÓRIA:
1. HOOK (0-15s): Gancho irresistível
2. PROBLEMA (15-60s): Agitação da dor
3. SOLUÇÃO (60-180s): Apresentação da oferta
4. PROVA (180-300s): Credibilidade e resultados
5. OFERTA (300-420s): Detalhes da oferta
6. URGÊNCIA (420-480s): Escassez e urgência
7. CTA (480-600s): Call to action final

Para cada seção, forneça:
- Texto exato para falar
- Elementos visuais sugeridos
- Timing aproximado
- Gatilhos psicológicos utilizados`,

    landing_page: `Você é um especialista em landing pages que converte acima de 15% consistentemente.

OBJETIVO: Criar uma landing page persuasiva e otimizada para conversão.

ELEMENTOS OBRIGATÓRIOS:
1. HEADLINE principal + subheadline
2. VALOR ÚNICO (proposta de valor clara)
3. BENEFÍCIOS (3-5 benefícios principais)
4. PROVA SOCIAL (depoimentos/números)
5. OFERTA (detalhes da oferta)
6. URGÊNCIA/ESCASSEZ
7. FAQ (objeções principais)
8. CTA (múltiplos pontos)

Para cada elemento, forneça:
- Texto otimizado
- Posicionamento na página
- Cores/elementos visuais sugeridos
- Razão psicológica por trás`,

    ads: `Você é um especialista em anúncios pagos com ROI médio de 8:1.

OBJETIVO: Criar anúncios persuasivos para diferentes plataformas.

FORMATOS NECESSÁRIOS:
1. PRIMARY TEXT (150-250 caracteres)
2. HEADLINE (40 caracteres)
3. DESCRIPTION (90 caracteres)
4. CTA BUTTON
5. VARIAÇÕES A/B (3 versões)

Para cada formato, considere:
- Plataforma específica (Meta/Google)
- Público-alvo definido
- Gatilhos de conversão
- Compliance das plataformas`,

    email: `Você é um especialista em email marketing com taxa média de abertura de 35%+.

OBJETIVO: Criar sequência de emails persuasiva.

TIPOS DE EMAIL:
1. WELCOME (boas-vindas)
2. EDUCACIONAL (valor)
3. SOCIAL PROOF (credibilidade)
4. OFERTA (conversão)
5. URGÊNCIA (escassez)
6. ÚLTIMO AVISO (fechamento)

Para cada email, forneça:
- Subject line (3 variações)
- Corpo do email otimizado
- CTA específico
- Timing de envio sugerido`
  };

  const selectedPrompt = prompts[data.copy_type];
  
  const systemPrompt = `${selectedPrompt}

INFORMAÇÕES DO PROJETO:
- Público-alvo: ${data.target_audience}
- Produto/Serviço: ${data.product_info}
- Respostas do Quiz: ${JSON.stringify(data.quiz_answers, null, 2)}

DIRETRIZES FINAIS:
- Use linguagem brasileira adequada ao público
- Seja específico e acionável
- Inclua métricas esperadas quando possível
- Formate a resposta de forma clara e organizada
- Adicione dicas de implementação prática`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Gere uma ${data.copy_type} completa e otimizada baseada nas informações fornecidas. Seja detalhado e prático.`
        }
      ],
      temperature: 0.8
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Claude API Error: ${response.status} - ${errorData}`);
  }

  const responseData = await response.json();
  const generatedContent = responseData.content[0].text;
  
  // **NOVA FUNCIONALIDADE: CONSUMIR TOKENS APÓS COPY GERADA**
  const promptTokens = responseData.usage?.input_tokens || estimatedTokens * 0.6;
  const completionTokens = responseData.usage?.output_tokens || countResponseTokens(generatedContent);
  const totalTokens = promptTokens + completionTokens;
  
  console.log(`Consumindo tokens para copy generation: prompt=${promptTokens}, completion=${completionTokens}, total=${totalTokens}`);
  
  // Consumir tokens e registrar uso
  const { data: consumeResult, error: consumeError } = await supabase
    .rpc('consume_tokens', {
      p_user_id: userId,
      p_tokens_used: totalTokens,
      p_feature_used: `copy_generation_${data.copy_type}`,
      p_prompt_tokens: promptTokens,
      p_completion_tokens: completionTokens
    });
  
  if (consumeError || !consumeResult) {
    console.error('Erro ao consumir tokens:', consumeError);
    throw new Error('Erro ao processar tokens após geração de copy');
  } else {
    console.log('Tokens consumidos com sucesso para copy generation');
  }

  return generatedContent;
}

async function triggerN8nWorkflow(workflowId: string, data: any) {
  try {
    const n8nWebhookUrl = `https://n8n.srv830837.hstgr.cloud/webhook/${workflowId}`;
    
    await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
        source: 'supabase-edge-function'
      }),
    });

    console.log(`N8n workflow ${workflowId} triggered successfully`);
  } catch (error) {
    console.error(`Error triggering N8n workflow ${workflowId}:`, error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, user_id, data, workflow_id, session_id }: N8nRequest = await req.json();

    console.log(`Processing N8n integration request: ${type} for user ${user_id}`);

    switch (type) {
      case 'copy_generation':
        const generatedCopy = await generateCopyWithClaude(data as CopyGenerationData, user_id);
        
        // Salvar copy gerada no Supabase
        const { error: insertError } = await supabase
          .from('copy_history')
          .insert({
            user_id,
            copy_type: data.copy_type,
            content: generatedCopy,
            quiz_data: data.quiz_answers,
            generated_via: 'n8n_claude_integration'
          });

        if (insertError) {
          console.error('Error saving copy to database:', insertError);
        }

        // Disparar workflow N8n para pós-processamento
        if (workflow_id) {
          await triggerN8nWorkflow(workflow_id, {
            user_id,
            copy_content: generatedCopy,
            copy_type: data.copy_type,
            session_id
          });
        }

        return new Response(
          JSON.stringify({
            success: true,
            copy: generatedCopy,
            type: data.copy_type,
            session_id
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'performance_analysis':
        // Análise de performance via Claude
        const analysisPrompt = `Analise os seguintes dados de performance e forneça insights acionáveis:
        
Dados: ${JSON.stringify(data, null, 2)}

Forneça:
1. Análise detalhada dos resultados
2. Pontos de melhoria específicos
3. Recomendações de otimização
4. Próximos passos sugeridos
5. Métricas para acompanhar`;

        const analysisResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 2000,
            messages: [{ role: 'user', content: analysisPrompt }],
            temperature: 0.3
          }),
        });

        const analysisData = await analysisResponse.json();
        const analysis = analysisData.content[0].text;

        return new Response(
          JSON.stringify({
            success: true,
            analysis,
            user_id,
            session_id
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'user_action':
        // Log de ações do usuário
        console.log(`User action logged: ${JSON.stringify(data)}`);
        
        if (workflow_id) {
          await triggerN8nWorkflow(workflow_id, {
            user_id,
            action_data: data,
            session_id
          });
        }

        return new Response(
          JSON.stringify({ success: true, logged: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'chat_response':
        // Processar resposta de chat via N8n
        if (workflow_id) {
          await triggerN8nWorkflow(workflow_id, {
            user_id,
            chat_data: data,
            session_id
          });
        }

        return new Response(
          JSON.stringify({ success: true, processed: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        throw new Error(`Tipo de request não suportado: ${type}`);
    }

  } catch (error) {
    console.error('Erro na integração N8n:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Erro no processamento',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
