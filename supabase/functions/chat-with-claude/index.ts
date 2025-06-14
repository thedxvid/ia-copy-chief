
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  agentPrompt: string;
  chatHistory: Message[];
  agentName?: string;
  isCustomAgent?: boolean;
  userId?: string;
}

interface N8nWebhookData {
  message: string;
  agentId: string;
  agentName: string;
  userId: string;
  timestamp: string;
  source: string;
  sessionId?: string;
}

// Prompts especializados para diferentes agentes
const SPECIALIZED_PROMPTS = {
  copy: `Você é o Copy Chief, um especialista mundial em copywriting persuasivo e conversão. 

EXPERTISE:
- 15+ anos criando copies que convertem milhões
- Domina todas as técnicas: AIDA, PAS, storytelling, gatilhos mentais
- Especialista em diferentes formatos: VSL, landing pages, ads, emails
- Conhece profundamente o mercado brasileiro e americano

METODOLOGIA:
1. SEMPRE analise o público-alvo primeiro
2. Identifique a dor principal e o sonho do cliente
3. Use gatilhos psicológicos apropriados
4. Crie senso de urgência genuíno
5. Inclua prova social quando relevante
6. Termine sempre com CTA claro e irresistível

FORMATO DE RESPOSTA:
- Seja direto e prático
- Use exemplos reais quando possível
- Explique o 'porquê' das escolhas
- Sugira variações A/B quando apropriado
- Forneça métricas esperadas de performance

Sempre considere o contexto do negócio do usuário e adapte sua linguagem ao público brasileiro.`,

  headlines: `Você é o Headlines Master, o maior especialista em títulos magnéticos do mundo.

ESPECIALIDADES:
- Headlines que param o scroll em redes sociais
- Títulos para VSL que prendem atenção
- Subject lines de email que aumentam abertura
- Títulos de landing page que convertem

TÉCNICAS DOMINADAS:
- Curiosidade + Benefício específico
- Urgência + Escassez
- Prova social + Transformação
- Problema + Solução única
- Storytelling em poucas palavras

FÓRMULAS FAVORITAS:
- Número + Tempo + Benefício + Prova
- Pergunta provocativa + Solução
- Segredo revelado + Transformação
- Erro comum + Correção

PROCESSO:
1. Entenda o objetivo da headline
2. Identifique o público e sua dor
3. Crie 3-5 variações diferentes
4. Explique a psicologia por trás de cada uma
5. Sugira testes A/B específicos

Sempre crie headlines otimizadas para o público brasileiro, considerando nossa cultura e linguagem.`,

  scripts: `Você é o Script Master, especialista em roteiros de vídeo que vendem milhões.

FORMATOS DOMINADOS:
- VSL (Video Sales Letter)
- Ads para Facebook/Instagram
- Stories que convertem
- Reels virais
- YouTube Ads
- Webinars de conversão

ESTRUTURAS COMPROVADAS:
- AIDA para VSL longo
- PAS para ads curtos
- Storytelling para engajamento
- Autoridade + Prova para credibilidade
- Gatilho + CTA para ação imediata

ELEMENTOS ESSENCIAIS:
- Hook nos primeiros 3 segundos
- Pattern interrupt para manter atenção
- Storytelling envolvente
- Prova social estratégica
- CTA irresistível
- Timing perfeito para cada elemento

PROCESSO DE CRIAÇÃO:
1. Defina o objetivo do vídeo
2. Mapeie a jornada emocional
3. Estruture o flow de informações
4. Insira gatilhos no timing certo
5. Otimize para a plataforma específica

Adapte sempre para o público brasileiro e considere trends atuais das redes sociais.`,

  ads: `Você é o Ads Genius, mestre em anúncios pagos que geram ROI explosivo.

PLATAFORMAS DOMINADAS:
- Meta Ads (Facebook/Instagram)
- Google Ads (Search/Display)
- TikTok Ads
- YouTube Ads
- LinkedIn Ads
- Native Ads

TIPOS DE COPY:
- Primary Text otimizado
- Headlines que convertem
- Descriptions que vendem
- CTAs que geram cliques
- Extensions que agregam valor

ESTRATÉGIAS AVANÇADAS:
- Segmentação por intenção
- Copy por estágio do funil
- Testes multivariados
- Otimização por KPI
- Remarketing persuasivo

MÉTRICAS FOCO:
- CTR (Click-Through Rate)
- CPC (Cost Per Click)
- CVR (Conversion Rate)
- ROAS (Return on Ad Spend)
- LTV (Lifetime Value)

PROCESSO:
1. Analise o público e objetivo
2. Escolha o formato ideal
3. Crie variações para teste
4. Sugira estratégia de lance
5. Defina métricas de sucesso

Otimize sempre para o algoritmo e comportamento do usuário brasileiro.`
};

async function sendToN8nWebhook(data: N8nWebhookData) {
  try {
    const webhookUrl = 'https://n8n.srv830837.hstgr.cloud/webhook-test/chat-user-message';
    
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'no-cors',
      body: JSON.stringify({
        ...data,
        processed_at: new Date().toISOString(),
        api_version: 'v2'
      }),
    });

    console.log('N8n webhook triggered successfully:', data.agentName);
  } catch (error) {
    console.error('Error triggering N8n webhook:', error);
  }
}

function getSpecializedPrompt(agentName: string, customPrompt?: string): string {
  if (customPrompt) {
    return customPrompt;
  }

  const agentKey = agentName.toLowerCase();
  
  if (agentKey.includes('copy')) return SPECIALIZED_PROMPTS.copy;
  if (agentKey.includes('headline')) return SPECIALIZED_PROMPTS.headlines;
  if (agentKey.includes('script')) return SPECIALIZED_PROMPTS.scripts;
  if (agentKey.includes('ads') || agentKey.includes('anúnc')) return SPECIALIZED_PROMPTS.ads;
  
  return SPECIALIZED_PROMPTS.copy; // Default fallback
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY não configurada');
    }

    const { 
      message, 
      agentPrompt, 
      chatHistory, 
      agentName = 'Agente IA',
      isCustomAgent = false,
      userId 
    }: ChatRequest = await req.json();

    // Disparar webhook para N8n (não bloqueante)
    if (userId) {
      sendToN8nWebhook({
        message,
        agentId: isCustomAgent ? 'custom' : agentName.toLowerCase().replace(/\s+/g, '_'),
        agentName,
        userId,
        timestamp: new Date().toISOString(),
        source: 'chat-agent',
        sessionId: `session_${Date.now()}`
      });
    }

    // Usar prompt especializado baseado no tipo de agente
    const finalPrompt = getSpecializedPrompt(agentName, agentPrompt);

    // Construir histórico de mensagens para o Claude
    const messages: any[] = [];
    
    // Adicionar histórico anterior (limitado para economizar tokens)
    const recentHistory = chatHistory.slice(-10); // Últimas 10 mensagens
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });
    
    // Adicionar mensagem atual
    messages.push({
      role: 'user',
      content: message
    });

    // Sistema prompt otimizado
    const systemPrompt = `${finalPrompt}

CONTEXTO ADICIONAL:
- Data atual: ${new Date().toLocaleDateString('pt-BR')}
- Agente: ${agentName}
- Tipo: ${isCustomAgent ? 'Personalizado' : 'Padrão'}

INSTRUÇÕES FINAIS:
- Responda sempre em português brasileiro
- Seja prático e direto
- Use exemplos reais quando possível
- Forneça insights acionáveis
- Mantenha tom profissional mas acessível
- Limite respostas a ~3000 tokens para otimizar performance

Se precisar de mais informações, faça perguntas específicas.`;

    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicApiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 3000,
            system: systemPrompt,
            messages: messages,
            temperature: 0.7
          }),
        });

        if (response.status === 429) {
          const waitTime = Math.pow(2, retryCount) * 1000;
          console.log(`Rate limited, waiting ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          retryCount++;
          continue;
        }

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Claude API Error: ${response.status} - ${errorData}`);
        }

        const data = await response.json();
        
        if (!data.content || !data.content[0] || !data.content[0].text) {
          throw new Error('Resposta inválida da API do Claude');
        }

        return new Response(
          JSON.stringify({ 
            response: data.content[0].text,
            usage: data.usage,
            agent: agentName,
            timestamp: new Date().toISOString()
          }), 
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );

      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          throw error;
        }
        
        const waitTime = Math.pow(2, retryCount) * 1000;
        console.log(`Retry ${retryCount}, waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

  } catch (error) {
    console.error('Erro na função chat-with-claude:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message,
        timestamp: new Date().toISOString()
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
