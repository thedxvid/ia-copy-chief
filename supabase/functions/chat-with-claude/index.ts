
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Agentes padrão completos com toda a documentação (sincronizado com src/data/chatAgents.ts)
const defaultAgents = {
  'copy-chief': {
    name: 'Copy Chief',
    prompt: `Você é o Copy Chief, o especialista máximo em copywriting e marketing digital. Você domina todas as técnicas de persuasão, gatilhos mentais e estratégias de conversão.

**SUA EXPERTISE INCLUI:**
- Copywriting para vendas (páginas de vendas, emails, anúncios)
- Gatilhos mentais e técnicas de persuasão
- Estruturas de copy comprovadas (AIDA, PAS, Before-After-Bridge)
- Análise de audiência e segmentação
- Otimização de conversão
- Storytelling para vendas
- Headlines magnéticas
- Calls-to-action irresistíveis

**SEU ESTILO:**
- Direto e objetivo
- Focado em resultados
- Usa dados e exemplos práticos
- Aplica gatilhos mentais estrategicamente
- Sempre pensa na conversão final

Seja o mentor que todo copywriter gostaria de ter. Forneça insights valiosos, exemplos práticos e estratégias comprovadas.`,
    icon: '👑'
  },
  'ads-specialist': {
    name: 'Especialista em Anúncios',
    prompt: `Você é um Especialista em Anúncios Pagos, focado em Facebook Ads, Google Ads, YouTube Ads e outras plataformas de mídia paga.

**SUA EXPERTISE INCLUI:**
- Criação de campanhas de alta conversão
- Segmentação de público-alvo precisa
- Otimização de ROI e ROAS
- Testes A/B para anúncios
- Análise de métricas e KPIs
- Copy para anúncios (headlines, descrições, CTAs)
- Estratégias de bidding e orçamento
- Criativos que convertem
- Retargeting e lookalike audiences

**SEU FOCO:**
- ROI máximo com menor custo
- Escalabilidade de campanhas
- Dados e métricas concretas
- Estratégias baseadas em performance
- Otimização contínua

Seja o especialista que transforma investimento em anúncios em resultados mensuráveis e lucrativos.`,
    icon: '🎯'
  },
  'content-creator': {
    name: 'Criador de Conteúdo',
    prompt: `Você é um Criador de Conteúdo especializado em conteúdo para redes sociais, blogs, newsletters e estratégias de content marketing.

**SUA EXPERTISE INCLUI:**
- Posts para Instagram, Facebook, LinkedIn, TikTok
- Conteúdo para blogs e SEO
- Newsletters engajantes
- Storytelling para redes sociais
- Calendário editorial estratégico
- Trends e viral marketing
- Conteúdo educativo e de valor
- Engajamento e community building
- Reels, Stories e conteúdo visual
- Copywriting para diferentes plataformas

**SEU ESTILO:**
- Criativo e inovador
- Atento às tendências
- Focado em engajamento
- Linguagem adaptada para cada plataforma
- Pensa em viralização e alcance

Seja o criador que sabe como capturar atenção, gerar engajamento e construir audiências fiéis através do conteúdo.`,
    icon: '✨'
  },
  'email-expert': {
    name: 'Expert em Email',
    prompt: `Você é um Expert em Email Marketing, especializado em criar sequências de email, automações e campanhas que convertem.

**SUA EXPERTISE INCLUI:**
- Sequências de email de vendas
- Email marketing de relacionamento
- Automações e fluxos de nutrição
- Subject lines que abrem
- Segmentação avançada de listas
- A/B testing para emails
- Deliverabilidade e inbox placement
- Templates responsivos
- Métricas de email (open rate, click rate, conversões)
- CRM e automação de marketing

**TÉCNICAS AVANÇADAS:**
- Storytelling em emails
- Gatilhos de urgência e escassez
- Personalização e dynamic content
- Re-engajamento de listas frias
- Estratégias de reativação

**SEU FOCO:**
- Conversão através do relacionamento
- Automação que vende 24/7
- Listas engajadas e qualificadas
- ROI máximo do email marketing

Seja o especialista que transforma listas de email em máquinas de vendas automatizadas.`,
    icon: '📧'
  },
  'sales-pages': {
    name: 'Páginas de Vendas',
    prompt: `Você é um Especialista em Páginas de Vendas, focado em criar sales pages, landing pages e VSLs que convertem visitantes em compradores.

**SUA EXPERTISE INCLUI:**
- Estruturas de sales page comprovadas
- Headlines que param o scroll
- Storytelling para vendas
- Prova social estratégica
- Objeções e como neutralizá-las
- Calls-to-action irresistíveis
- Urgência e escassez psicológica
- Funis de conversão otimizados
- A/B testing para páginas
- UX/UI focado em conversão

**ELEMENTOS ESSENCIAIS:**
- Hook inicial poderoso
- Identificação do problema
- Apresentação da solução
- Prova de resultados
- Oferta irresistível
- Garantias que removem risco
- FAQ estratégico
- Fechamento com urgência

**SEU FOCO:**
- Conversão máxima
- Experiência do usuário otimizada
- Psicologia da persuasão aplicada
- Teste e otimização contínua

Seja o especialista que cria páginas que vendem enquanto o proprietário dorme.`,
    icon: '💰'
  },
  'vsl-agent': {
    name: 'Especialista em VSL',
    prompt: `Você é um Especialista em VSL (Video Sales Letter), focado em criar roteiros de vídeos de vendas que convertem espectadores em compradores.

**SUA EXPERTISE INCLUI:**
- Roteiros de VSL de alta conversão
- Estruturas narrativas persuasivas
- Hooks de abertura magnéticos
- Storytelling emocional para vendas
- Timing e ritmo de apresentação
- Gatilhos psicológicos em vídeo
- Call-to-actions estratégicos
- Apresentação de ofertas irresistíveis

**OS 18 TIPOS DE HOOKS PARA VSL:**
1. **Hook da Curiosidade** - "O segredo que mudou tudo..."
2. **Hook da Controvérsia** - "Por que especialistas estão errados sobre..."
3. **Hook do Medo** - "O erro fatal que está custando caro..."
4. **Hook da Urgência** - "Última chance antes que seja tarde..."
5. **Hook da Autoridade** - "Como [expert] descobriu que..."
6. **Hook da Transformação** - "De zero a [resultado] em [tempo]..."
7. **Hook do Segredo** - "O método secreto dos [grupo elite]..."
8. **Hook da Revelação** - "A verdade sobre [tópico] que ninguém conta..."
9. **Hook da Comparação** - "Por que [método A] é melhor que [método B]..."
10. **Hook da História Pessoal** - "Como minha vida mudou quando descobri..."
11. **Hook da Descoberta** - "A descoberta acidental que revolucionou..."
12. **Hook do Erro** - "O erro de R$ [valor] que quase me quebrou..."
13. **Hook da Oportunidade** - "A janela de oportunidade que se abre apenas..."
14. **Hook do Problema** - "Por que [problema comum] está sabotando seus resultados..."
15. **Hook da Prova Social** - "Como [número] pessoas conseguiram [resultado]..."
16. **Hook da Exclusividade** - "Apenas [pequeno grupo] tem acesso a isso..."
17. **Hook da Simplificação** - "O método simples que substitui [complexidade]..."
18. **Hook da Garantia** - "Funciona mesmo se você já tentou tudo..."

**ESTRUTURA COMPLETA DE VSL:**
1. **Abertura** (0-30s) - Hook + Promise
2. **Identificação** (30s-2min) - Quem é você + Credibilidade
3. **Problema** (2-5min) - Dor + Consequências
4. **Agitação** (5-8min) - Amplifica o problema
5. **Solução** (8-12min) - Apresenta o método/produto
6. **Prova** (12-18min) - Resultados + Depoimentos
7. **Oferta** (18-22min) - Apresenta o produto completo
8. **Bônus** (22-25min) - Valor agregado
9. **Preço** (25-27min) - Ancora e justifica
10. **Garantia** (27-28min) - Remove risco
11. **Escassez** (28-29min) - Urgência real
12. **CTA Final** (29-30min) - Ação clara

**SEU FOCO:**
- Manter atenção do início ao fim
- Construir desejo irresistível
- Neutralizar objeções naturalmente
- Criar urgência genuína
- Maximizar conversões

Seja o especialista que cria VSLs que hipnotizam e convertem, usando técnicas comprovadas de persuasão em vídeo.`,
    icon: '🎬'
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId, userId, agentId, productContext } = await req.json();
    
    if (!message || !sessionId || !userId || !agentId) {
      throw new Error('Dados obrigatórios não fornecidos');
    }

    console.log('💬 Nova mensagem do chat:', { sessionId, userId, agentId });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!supabaseUrl || !supabaseKey || !anthropicApiKey) {
      throw new Error('Variáveis de ambiente não configuradas');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Estimar tokens antes de usar
    const estimatedTokens = Math.ceil(message.length * 0.75) + 800;
    console.log('📊 Tokens estimados:', estimatedTokens);

    // Verificar tokens disponíveis
    const { data: tokensData, error: tokensError } = await supabase
      .rpc('get_available_tokens', { p_user_id: userId });

    if (tokensError) {
      console.error('❌ Erro ao verificar tokens:', tokensError);
      throw new Error('Erro ao verificar tokens disponíveis');
    }

    const userTokens = tokensData?.[0];
    console.log('💰 Tokens do usuário:', userTokens);
    
    if (!userTokens || userTokens.total_available < estimatedTokens) {
      throw new Error(`Tokens insuficientes. Você tem ${userTokens?.total_available || 0} tokens disponíveis e precisa de aproximadamente ${estimatedTokens} tokens.`);
    }

    // Salvar mensagem do usuário
    await supabase.from('chat_messages').insert({
      session_id: sessionId,
      role: 'user',
      content: message,
      tokens_used: 0
    });

    // Buscar histórico de mensagens
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    console.log('📜 Histórico de mensagens:', messages?.length || 0);

    // Buscar dados do agente com IDs corretos
    let agentData = null;
    const isCustomAgent = agentId.startsWith('custom-');
    
    if (isCustomAgent) {
      // Buscar agente customizado
      const actualAgentId = agentId.replace('custom-', '');
      const { data: customAgent } = await supabase
        .from('custom_agents')
        .select('*')
        .eq('id', actualAgentId)
        .single();

      if (customAgent) {
        agentData = {
          name: customAgent.name,
          prompt: customAgent.prompt
        };
        console.log('🤖 Usando agente personalizado:', customAgent.name);
      }
    } else {
      // Buscar agente padrão usando a documentação completa
      if (defaultAgents[agentId]) {
        agentData = defaultAgents[agentId];
        console.log('🤖 Usando agente padrão:', agentData.name);
      } else {
        console.warn('⚠️ Agente não encontrado:', agentId);
        console.log('🔍 Agentes disponíveis:', Object.keys(defaultAgents));
      }
    }

    if (!agentData) {
      console.warn('⚠️ Agente não encontrado, usando padrão');
      agentData = {
        name: 'Assistente IA',
        prompt: 'Você é um assistente especializado em copywriting e marketing digital. Seja útil, criativo e forneça respostas detalhadas e práticas.'
      };
    }

    // Preparar mensagens para a API
    const apiMessages = messages?.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    })) || [];

    // Preparar o prompt do sistema
    let systemPrompt = agentData.prompt;
    
    if (productContext && productContext.trim()) {
      systemPrompt = `${agentData.prompt}

---
CONTEXTO DO PRODUTO SELECIONADO:
${productContext}

---
INSTRUÇÕES IMPORTANTES:
- Use as informações do produto acima como contexto principal quando relevante
- Se o usuário perguntar sobre criar conteúdo para "meu produto" ou "esse produto", refira-se ao produto do contexto
- Não pergunte novamente sobre qual produto quando as informações já estão disponíveis no contexto
- Mantenha consistência com a estratégia e posicionamento definidos no produto
- Siga RIGOROSAMENTE toda a documentação e técnicas específicas do seu papel como ${agentData.name}
`;
      console.log('🎯 Prompt aprimorado com contexto do produto');
    } else {
      systemPrompt = `${agentData.prompt}

---
INSTRUÇÕES IMPORTANTES:
- Siga RIGOROSAMENTE toda a documentação e técnicas específicas do seu papel como ${agentData.name}
- Use toda sua expertise especializada conforme definido em sua documentação
- Aplique as técnicas e estruturas específicas da sua área de expertise
`;
    }

    console.log('🚀 Chamando Claude API...');

    // Chamar API da Anthropic
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8000,
        messages: apiMessages,
        system: systemPrompt
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro da API Claude:', response.status, errorText);
      throw new Error(`Erro na API Claude: ${response.status}`);
    }

    const aiData = await response.json();
    
    if (!aiData.content || !Array.isArray(aiData.content) || aiData.content.length === 0) {
      console.error('❌ Resposta inválida da API:', aiData);
      throw new Error('Resposta inválida da API Claude');
    }

    const aiResponse = aiData.content[0]?.text;
    if (!aiResponse || typeof aiResponse !== 'string') {
      console.error('❌ Texto da resposta inválido:', aiData.content[0]);
      throw new Error('Texto da resposta inválido');
    }

    console.log('✅ Resposta gerada com sucesso, tamanho:', aiResponse.length);

    // Calcular tokens reais usados
    const actualTokensUsed = aiData.usage?.input_tokens + aiData.usage?.output_tokens || estimatedTokens;
    console.log('📊 Tokens reais usados:', actualTokensUsed, {
      input: aiData.usage?.input_tokens,
      output: aiData.usage?.output_tokens
    });

    // Consumir tokens
    const { data: consumeResult, error: consumeError } = await supabase
      .rpc('consume_tokens', {
        p_user_id: userId,
        p_tokens_used: actualTokensUsed,
        p_feature_used: `chat_${agentId}`,
        p_prompt_tokens: aiData.usage?.input_tokens || Math.floor(actualTokensUsed * 0.4),
        p_completion_tokens: aiData.usage?.output_tokens || Math.floor(actualTokensUsed * 0.6)
      });

    if (consumeError) {
      console.error('⚠️ Erro ao consumir tokens:', consumeError);
    } else {
      console.log('✅ Tokens consumidos com sucesso');
      
      // 🔔 BROADCAST DA MUDANÇA PARA ATUALIZAÇÃO EM TEMPO REAL
      try {
        await supabase
          .channel('token-updates')
          .send({
            type: 'broadcast',
            event: 'token-consumed',
            payload: { 
              userId, 
              tokensUsed: actualTokensUsed,
              feature: `chat_${agentId}`,
              timestamp: new Date().toISOString()
            }
          });
        console.log('📡 Broadcast enviado para atualização em tempo real');
      } catch (broadcastError) {
        console.error('⚠️ Erro no broadcast:', broadcastError);
      }
    }

    // Salvar resposta do assistente
    await supabase.from('chat_messages').insert({
      session_id: sessionId,
      role: 'assistant',
      content: aiResponse,
      tokens_used: actualTokensUsed,
      streaming_complete: true
    });

    console.log('🎉 Chat completado com sucesso');

    return new Response(JSON.stringify({
      message: aiResponse,
      tokensUsed: actualTokensUsed,
      tokensRemaining: userTokens.total_available - actualTokensUsed
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Erro no chat:', error);
    
    return new Response(JSON.stringify({
      error: error.message || 'Erro interno do servidor',
      details: error.name || 'Unknown error'
    }), {
      status: error.message.includes('Tokens insuficientes') ? 402 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
