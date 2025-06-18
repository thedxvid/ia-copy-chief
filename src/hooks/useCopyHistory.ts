
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CopyHistoryItem {
  id: string;
  title: string;
  type: string;
  date: string;
  status: string;
  performance: string;
  content?: {
    landing_page_copy?: any;
    email_campaign?: any;
    social_media_content?: any;
    vsl_script?: string;
    whatsapp_messages?: string[];
    telegram_messages?: string[];
    quiz_content?: string;
  };
  product?: {
    name: string;
    niche: string;
    sub_niche?: string;
  };
  source: 'product' | 'quiz';
  quiz_type?: string;
  quiz_answers?: Record<string, string>;
}

const getExampleData = (): CopyHistoryItem[] => [
  {
    id: 'example-1',
    title: "Landing Page de Alta Conversão - Curso de Marketing Digital",
    type: "Landing Page",
    date: new Date().toLocaleDateString('pt-BR'),
    status: "Concluído",
    performance: "Alta conversão",
    source: 'product',
    content: {
      landing_page_copy: {
        headline: "Transforme Sua Vida Financeira com Marketing Digital",
        subheadline: "Aprenda as estratégias exatas que me levaram de zero aos 6 dígitos em 12 meses",
        cta: "Quero Começar Agora!",
        body: "Descubra como pessoas comuns estão construindo negócios de 6 dígitos usando apenas o celular e algumas estratégias simples de marketing digital..."
      }
    },
    product: {
      name: "Curso de Marketing Digital",
      niche: "Marketing Digital",
      sub_niche: "Infoprodutos"
    }
  },
  {
    id: 'example-2',
    title: "Sequência de Email Marketing - Nutrição e Emagrecimento",
    type: "Email",
    date: new Date(Date.now() - 86400000).toLocaleDateString('pt-BR'),
    status: "Em teste",
    performance: "Média conversão",
    source: 'product',
    content: {
      email_campaign: {
        subject: "🔥 O Método que Eliminou 15kg em 90 Dias (Sem Dieta Maluca)",
        body: "Olá! Você já tentou de tudo para emagrecer e nada funcionou? Eu sei exatamente como você se sente...",
        cta: "Quero Conhecer o Método"
      }
    },
    product: {
      name: "Método de Emagrecimento Natural",
      niche: "Saúde e Bem-estar",
      sub_niche: "Emagrecimento"
    }
  },
  {
    id: 'example-3',
    title: "Script de Vendas - Webinar de Investimentos",
    type: "Script",
    date: new Date(Date.now() - 172800000).toLocaleDateString('pt-BR'),
    status: "Concluído",
    performance: "Alta conversão",
    source: 'product',
    content: {
      vsl_script: "Olá, meu nome é João Silva e nos próximos 45 minutos vou revelar como construí um patrimônio de R$ 1 milhão investindo apenas R$ 100 por mês..."
    },
    product: {
      name: "Webinar Investimentos Inteligentes",
      niche: "Finanças",
      sub_niche: "Investimentos"
    }
  },
  {
    id: 'example-4',
    title: "Posts para Instagram - Desenvolvimento Pessoal",
    type: "Social Media",
    date: new Date(Date.now() - 259200000).toLocaleDateString('pt-BR'),
    status: "Concluído",
    performance: "Baixa conversão",
    source: 'product',
    content: {
      social_media_content: {
        headlines: [
          "✨ 3 Hábitos que Mudaram Minha Vida Completamente",
          "🚀 Por que 90% das Pessoas Falham nos Objetivos (e Como Não Ser Uma Delas)",
          "💡 A Única Coisa que Separa Você do Sucesso"
        ],
        posts: [
          "Você sabia que apenas 8% das pessoas conseguem cumprir suas metas? Descubra o que os 8% fazem diferente...",
          "Sua mente é como um jardim: se você não plantar flores, as ervas daninhas crescerão sozinhas...",
          "O sucesso não é sobre fazer coisas extraordinárias. É sobre fazer coisas ordinárias extraordinariamente bem."
        ]
      }
    },
    product: {
      name: "Curso de Desenvolvimento Pessoal",
      niche: "Desenvolvimento Pessoal",
      sub_niche: "Produtividade"
    }
  },
  {
    id: 'example-5',
    title: "Mensagens WhatsApp - Coaching de Relacionamentos",
    type: "WhatsApp",
    date: new Date(Date.now() - 345600000).toLocaleDateString('pt-BR'),
    status: "Em teste",
    performance: "Em análise",
    source: 'product',
    content: {
      whatsapp_messages: [
        "Oi! Você já se perguntou por que alguns relacionamentos duram décadas enquanto outros não passam de alguns meses? 🤔",
        "A verdade é que existe uma 'fórmula' para relacionamentos duradouros, e hoje vou compartilhar com você! ❤️",
        "Quer descobrir os 3 pilares de um relacionamento sólido? Responda SIM que eu te conto tudo! 👇"
      ]
    },
    product: {
      name: "Coaching de Relacionamentos",
      niche: "Relacionamentos",
      sub_niche: "Coaching"
    }
  },
  {
    id: 'example-quiz-1',
    title: "Copy para Email Marketing - Quiz Personalizado",
    type: "Quiz Email",
    date: new Date(Date.now() - 432000000).toLocaleDateString('pt-BR'),
    status: "Concluído",
    performance: "Em análise",
    source: 'quiz',
    quiz_type: "email_marketing",
    content: {
      quiz_content: "Assunto: 🚀 Descubra o Segredo dos 6 Dígitos em 30 Dias\n\nOlá [Nome],\n\nVocê já imaginou como seria ganhar mais em um mês do que muitos ganham em um ano inteiro?\n\nEu sei que pode parecer impossível, mas deixe-me contar uma história...\n\n[Resto do email personalizado baseado nas respostas do quiz]"
    }
  }
];

export const useCopyHistory = () => {
  const [historyItems, setHistoryItems] = useState<CopyHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingExampleData, setIsUsingExampleData] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchCopyHistory();
  }, [user]);

  const fetchCopyHistory = async () => {
    if (!user) {
      setLoading(false);
      setIsUsingExampleData(true);
      setHistoryItems(getExampleData());
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Buscar copies de produtos
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          niche,
          sub_niche,
          created_at,
          product_copy (
            id,
            landing_page_copy,
            email_campaign,
            social_media_content,
            vsl_script,
            whatsapp_messages,
            telegram_messages,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Buscar copies do quiz
      const { data: quizData, error: quizError } = await supabase
        .from('quiz_copies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (productsError) {
        throw productsError;
      }

      if (quizError) {
        throw quizError;
      }

      const transformedData: CopyHistoryItem[] = [];

      // Transformar dados dos produtos
      productsData?.forEach(product => {
        // Verificar se product_copy existe e é um array ou objeto único
        const productCopies = Array.isArray(product.product_copy) 
          ? product.product_copy 
          : product.product_copy 
            ? [product.product_copy] 
            : [];

        productCopies.forEach(copy => {
          let type = 'Copy Geral';
          if (copy.landing_page_copy) type = 'Landing Page';
          else if (copy.email_campaign) type = 'Email';
          else if (copy.vsl_script) type = 'Script';
          else if (copy.whatsapp_messages?.length) type = 'WhatsApp';
          else if (copy.social_media_content) type = 'Social Media';

          const performances = ['Alta conversão', 'Média conversão', 'Baixa conversão', 'Em análise'];
          const statuses = ['Concluído', 'Em teste', 'Rascunho'];
          
          transformedData.push({
            id: copy.id,
            title: `Copy para ${product.name} - ${type}`,
            type,
            date: new Date(copy.created_at).toLocaleDateString('pt-BR'),
            status: statuses[Math.floor(Math.random() * statuses.length)],
            performance: performances[Math.floor(Math.random() * performances.length)],
            source: 'product',
            content: {
              landing_page_copy: copy.landing_page_copy,
              email_campaign: copy.email_campaign,
              social_media_content: copy.social_media_content,
              vsl_script: copy.vsl_script,
              whatsapp_messages: copy.whatsapp_messages,
              telegram_messages: copy.telegram_messages,
            },
            product: {
              name: product.name,
              niche: product.niche,
              sub_niche: product.sub_niche,
            },
          });
        });
      });

      // Transformar dados do quiz
      quizData?.forEach(quizCopy => {
        const quizTypeMap: Record<string, string> = {
          email_marketing: 'Quiz Email',
          landing_page: 'Quiz Landing Page',
          sales_letter: 'Quiz Carta de Vendas',
          social_media: 'Quiz Social Media',
          vsl: 'Quiz VSL'
        };

        // Safely handle quiz_answers type conversion
        let safeQuizAnswers: Record<string, string> = {};
        if (quizCopy.quiz_answers && typeof quizCopy.quiz_answers === 'object' && !Array.isArray(quizCopy.quiz_answers)) {
          safeQuizAnswers = quizCopy.quiz_answers as Record<string, string>;
        }

        // Safely handle generated_copy content extraction
        let quizContent = '';
        if (quizCopy.generated_copy) {
          if (typeof quizCopy.generated_copy === 'string') {
            quizContent = quizCopy.generated_copy;
          } else if (typeof quizCopy.generated_copy === 'object' && !Array.isArray(quizCopy.generated_copy)) {
            const copyObj = quizCopy.generated_copy as { [key: string]: any };
            quizContent = copyObj.content || JSON.stringify(quizCopy.generated_copy);
          } else {
            quizContent = JSON.stringify(quizCopy.generated_copy);
          }
        }

        transformedData.push({
          id: quizCopy.id,
          title: quizCopy.title,
          type: quizTypeMap[quizCopy.quiz_type] || 'Quiz',
          date: new Date(quizCopy.created_at).toLocaleDateString('pt-BR'),
          status: 'Concluído',
          performance: 'Em análise',
          source: 'quiz',
          quiz_type: quizCopy.quiz_type,
          quiz_answers: safeQuizAnswers,
          content: {
            quiz_content: quizContent
          }
        });
      });

      // Ordenar por data (mais recente primeiro)
      transformedData.sort((a, b) => new Date(b.date.split('/').reverse().join('-')).getTime() - new Date(a.date.split('/').reverse().join('-')).getTime());

      if (transformedData.length === 0) {
        setHistoryItems(getExampleData());
        setIsUsingExampleData(true);
      } else {
        setHistoryItems(transformedData);
        setIsUsingExampleData(false);
      }
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
      setError('Erro ao carregar histórico de copies');
      setHistoryItems(getExampleData());
      setIsUsingExampleData(true);
    } finally {
      setLoading(false);
    }
  };

  return {
    historyItems,
    loading,
    error,
    isUsingExampleData,
    refetch: fetchCopyHistory,
  };
};
