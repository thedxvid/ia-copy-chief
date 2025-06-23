
import { supabase } from '@/integrations/supabase/client';
import type { QuizQuestion } from '@/hooks/useQuizTemplates';

export interface QuizData {
  [key: string]: QuizQuestion[];
}

export const getQuizTitle = (quizType: string): string => {
  const titles = {
    vsl: 'Vídeo de Vendas (VSL)',
    product: 'Estrutura de Oferta',
    landing: 'Landing Page',
    ads: 'Anúncios Pagos',
    email_marketing: 'Email Marketing',
    sales_letter: 'Carta de Vendas',
    social_media: 'Social Media'
  };
  
  return titles[quizType as keyof typeof titles] || 'Quiz Personalizado';
};

export const getQuizQuestions = async (quizType: string): Promise<QuizQuestion[]> => {
  console.log(`🔍 [QuizQuestions] Carregando perguntas para o tipo: ${quizType}`);
  
  // Se for um template personalizado
  if (quizType.startsWith('template_')) {
    const templateId = quizType.replace('template_', '');
    console.log(`📋 [QuizQuestions] Carregando template personalizado ID: ${templateId}`);
    
    try {
      const { data: template, error } = await supabase
        .from('quiz_templates')
        .select('questions, title')
        .eq('id', templateId)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('❌ [QuizQuestions] Erro ao carregar template:', error);
        throw error;
      }

      if (!template) {
        console.error('❌ [QuizQuestions] Template não encontrado ou inativo');
        throw new Error('Template não encontrado ou inativo');
      }

      console.log(`✅ [QuizQuestions] Template carregado: ${template.title}`);
      
      // Processar perguntas do template
      let questions: QuizQuestion[] = [];
      if (Array.isArray(template.questions)) {
        questions = template.questions as unknown as QuizQuestion[];
      } else {
        console.warn('⚠️ [QuizQuestions] Perguntas do template não estão no formato esperado');
      }

      console.log(`📝 [QuizQuestions] ${questions.length} perguntas carregadas do template`);
      return questions;
    } catch (error) {
      console.error('💥 [QuizQuestions] Erro ao carregar perguntas do template:', error);
      throw error;
    }
  }
  
  // Quiz padrões - primeiro tentar buscar do banco de dados
  console.log(`📚 [QuizQuestions] Buscando quiz padrão no banco: ${quizType}`);
  
  try {
    const { data: template, error } = await supabase
      .from('quiz_templates')
      .select('questions, title')
      .eq('quiz_type', quizType)
      .eq('is_active', true)
      .eq('is_default', true)
      .single();

    if (!error && template) {
      console.log(`✅ [QuizQuestions] Template padrão encontrado no banco: ${template.title}`);
      
      let questions: QuizQuestion[] = [];
      if (Array.isArray(template.questions)) {
        questions = template.questions as unknown as QuizQuestion[];
      }
      
      console.log(`📝 [QuizQuestions] ${questions.length} perguntas carregadas do banco`);
      return questions;
    }
  } catch (error) {
    console.warn('⚠️ [QuizQuestions] Erro ao buscar template padrão no banco:', error);
  }
  
  // Fallback para perguntas hardcoded
  console.log(`📋 [QuizQuestions] Usando perguntas hardcoded para: ${quizType}`);
  
  const standardQuestions = {
    vsl: [
      {
        id: 'product',
        question: 'Qual é o nome do seu produto ou serviço?',
        type: 'text' as const,
        required: true,
        placeholder: 'Ex: Curso de Marketing Digital'
      },
      {
        id: 'target',
        question: 'Quem é o seu público-alvo ideal?',
        type: 'textarea' as const,
        required: true,
        placeholder: 'Descreva detalhadamente seu cliente ideal, suas dores, desejos e características demográficas'
      },
      {
        id: 'problem',
        question: 'Qual é o principal problema que seu produto resolve?',
        type: 'textarea' as const,
        required: true,
        placeholder: 'Descreva o problema de forma clara e específica'
      },
      {
        id: 'benefit',
        question: 'Qual é o principal benefício que seu produto oferece?',
        type: 'textarea' as const,
        required: true,
        placeholder: 'Qual transformação ou resultado seu cliente terá?'
      },
      {
        id: 'proof',
        question: 'Que prova ou credibilidade você tem para oferecer?',
        type: 'textarea' as const,
        required: true,
        placeholder: 'Depoimentos, casos de sucesso, certificações, experiência...'
      },
      {
        id: 'price',
        question: 'Qual é o preço do seu produto?',
        type: 'text' as const,
        required: true,
        placeholder: 'Ex: R$ 497 ou 12x de R$ 49,70'
      },
      {
        id: 'urgency',
        question: 'Que elemento de urgência ou escassez você pode usar?',
        type: 'textarea' as const,
        required: false,
        placeholder: 'Promoção por tempo limitado, vagas limitadas, bônus exclusivos...'
      },
      {
        id: 'guarantee',
        question: 'Que garantia você oferece?',
        type: 'text' as const,
        required: false,
        placeholder: 'Ex: Garantia de 30 dias ou seu dinheiro de volta'
      },
      {
        id: 'objections',
        question: 'Quais são as principais objeções do seu público?',
        type: 'textarea' as const,
        required: true,
        placeholder: 'Liste as dúvidas e resistências mais comuns dos clientes'
      },
      {
        id: 'cta',
        question: 'Qual é a sua chamada para ação?',
        type: 'text' as const,
        required: true,
        placeholder: 'Ex: Compre Agora, Inscreva-se Hoje, Acesse Já'
      }
    ],
    
    product: [
      {
        id: 'product_name',
        question: 'Qual é o nome do seu produto?',
        type: 'text' as const,
        required: true,
        placeholder: 'Nome completo do produto'
      },
      {
        id: 'target_audience',
        question: 'Descreva seu público-alvo ideal',
        type: 'textarea' as const,
        required: true,
        placeholder: 'Demografia, psicografia, problemas e desejos'
      },
      {
        id: 'value_proposition',
        question: 'Qual é sua proposta de valor única?',
        type: 'textarea' as const,
        required: true,
        placeholder: 'O que torna seu produto único e valioso'
      },
      {
        id: 'main_benefits',
        question: 'Liste os 3 principais benefícios',
        type: 'textarea' as const,
        required: true,
        placeholder: 'Benefícios claros e mensuráveis'
      },
      {
        id: 'pricing_strategy',
        question: 'Qual é sua estratégia de preço?',
        type: 'textarea' as const,
        required: true,
        placeholder: 'Preço, formas de pagamento, comparações de valor'
      },
      {
        id: 'bonuses',
        question: 'Que bônus você pode incluir?',
        type: 'textarea' as const,
        required: false,
        placeholder: 'Liste bônus valiosos que complementam a oferta'
      },
      {
        id: 'guarantee_terms',
        question: 'Que garantia você oferece?',
        type: 'text' as const,
        required: true,
        placeholder: 'Tipo e prazo da garantia'
      },
      {
        id: 'scarcity_elements',
        question: 'Elementos de escassez ou urgência',
        type: 'textarea' as const,
        required: false,
        placeholder: 'Tempo limitado, vagas limitadas, preço promocional...'
      },
      {
        id: 'social_proof',
        question: 'Que prova social você tem?',
        type: 'textarea' as const,
        required: false,
        placeholder: 'Depoimentos, números, casos de sucesso'
      },
      {
        id: 'call_to_action',
        question: 'Qual é sua chamada principal para ação?',
        type: 'text' as const,
        required: true,
        placeholder: 'Ex: Garantir Minha Vaga Agora'
      }
    ],
    
    landing: [
      {
        id: 'produto',
        question: 'Qual produto você está promovendo?',
        type: 'text' as const,
        required: true,
        placeholder: 'Nome do produto ou serviço'
      },
      {
        id: 'publico_alvo',
        question: 'Quem é seu público-alvo?',
        type: 'textarea' as const,
        required: true,
        placeholder: 'Descreva detalhadamente seu cliente ideal'
      },
      {
        id: 'problema_principal',
        question: 'Qual o principal problema que seu produto resolve?',
        type: 'textarea' as const,
        required: true,
        placeholder: 'O problema mais urgente do seu público'
      },
      {
        id: 'solucao_oferecida',
        question: 'Como seu produto resolve este problema?',
        type: 'textarea' as const,
        required: true,
        placeholder: 'A solução específica que você oferece'
      },
      {
        id: 'beneficios_principais',
        question: 'Quais são os 3 principais benefícios?',
        type: 'textarea' as const,
        required: true,
        placeholder: 'Benefícios tangíveis e mensuráveis'
      },
      {
        id: 'diferencial_competitivo',
        question: 'O que torna seu produto único?',
        type: 'textarea' as const,
        required: true,
        placeholder: 'Seu diferencial em relação à concorrência'
      },
      {
        id: 'prova_social',
        question: 'Que prova social você pode usar?',
        type: 'textarea' as const,
        required: false,
        placeholder: 'Depoimentos, casos de sucesso, números impressionantes'
      },
      {
        id: 'oferta_especifica',
        question: 'Qual é sua oferta específica?',
        type: 'textarea' as const,
        required: true,
        placeholder: 'Preço, forma de pagamento, bônus, garantia'
      },
      {
        id: 'urgencia_escassez',
        question: 'Elementos de urgência ou escassez',
        type: 'textarea' as const,
        required: false,
        placeholder: 'Tempo limitado, vagas limitadas, desconto especial'
      },
      {
        id: 'cta_principal',
        question: 'Qual é sua call-to-action principal?',
        type: 'text' as const,
        required: true,
        placeholder: 'Ex: Quero Começar Agora, Garantir Minha Vaga'
      }
    ],
    
    ads: [
      {
        id: 'objetivo_campanha',
        question: 'Qual é o objetivo da sua campanha?',
        type: 'radio' as const,
        required: true,
        options: [
          'Gerar leads (capturar contatos)',
          'Vendas diretas',
          'Reconhecimento de marca',
          'Tráfego para site/blog',
          'Engajamento nas redes sociais'
        ]
      },
      {
        id: 'publico_segmentado',
        question: 'Descreva seu público-alvo para segmentação',
        type: 'textarea' as const,
        required: true,
        placeholder: 'Idade, localização, interesses, comportamentos, demografias'
      },
      {
        id: 'produto_promovido',
        question: 'Que produto/serviço você está promovendo?',
        type: 'text' as const,
        required: true,
        placeholder: 'Nome e breve descrição'
      },
      {
        id: 'proposta_valor',
        question: 'Qual é sua proposta de valor em uma frase?',
        type: 'textarea' as const,
        required: true,
        placeholder: 'Benefício principal de forma clara e impactante'
      },
      {
        id: 'emocao_despertar',
        question: 'Que emoção você quer despertar?',
        type: 'radio' as const,
        required: true,
        options: [
          'Desejo/Aspiração',
          'Medo/Urgência',
          'Curiosidade',
          'Confiança/Segurança',
          'Alegria/Diversão'
        ]
      },
      {
        id: 'call_to_action',
        question: 'Qual ação você quer que tomem?',
        type: 'text' as const,
        required: true,
        placeholder: 'Ex: Clique aqui, Saiba mais, Compre agora'
      },
      {
        id: 'orcamento_diario',
        question: 'Qual seu orçamento diário aproximado?',
        type: 'radio' as const,
        required: false,
        options: [
          'Até R$ 50/dia',
          'R$ 50 - R$ 100/dia',
          'R$ 100 - R$ 300/dia',
          'R$ 300 - R$ 500/dia',
          'Acima de R$ 500/dia'
        ]
      },
      {
        id: 'plataforma_prioritaria',
        question: 'Qual plataforma é prioritária?',
        type: 'radio' as const,
        required: true,
        options: [
          'Facebook/Instagram',
          'Google Ads',
          'TikTok',
          'LinkedIn',
          'YouTube'
        ]
      },
      {
        id: 'tom_linguagem',
        question: 'Que tom de linguagem usar?',
        type: 'radio' as const,
        required: true,
        options: [
          'Formal e profissional',
          'Casual e amigável',
          'Divertido e descontraído',
          'Urgente e persuasivo',
          'Educativo e informativo'
        ]
      },
      {
        id: 'diferencial_concorrencia',
        question: 'Como você se diferencia da concorrência?',
        type: 'textarea' as const,
        required: true,
        placeholder: 'Pontos únicos que te destacam no mercado'
      }
    ]
  };

  const questions = standardQuestions[quizType as keyof typeof standardQuestions];
  
  if (!questions) {
    console.warn(`⚠️ [QuizQuestions] Nenhuma pergunta encontrada para o tipo: ${quizType}`);
    return [];
  }

  console.log(`✅ [QuizQuestions] ${questions.length} perguntas padrão carregadas para ${quizType}`);
  return questions;
};

export const invalidateQuizTemplatesCache = () => {
  console.log('🗑️ [QuizQuestions] Cache de templates invalidado');
};
