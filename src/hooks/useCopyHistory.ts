
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
    conversation?: {
      messages: Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp: string;
      }>;
      agent_name: string;
      product_name?: string;
    };
  };
  product?: {
    name: string;
    niche: string;
    sub_niche?: string;
  };
  source: 'product' | 'quiz' | 'conversation';
  quiz_type?: string;
  quiz_answers?: Record<string, string>;
  conversation_data?: {
    agent_name: string;
    agent_id: string;
    product_id?: string;
    message_count: number;
  };
  created_at?: string;
  updated_at?: string;
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
    created_at: new Date().toISOString(),
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
    created_at: new Date(Date.now() - 86400000).toISOString(),
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
    id: 'example-conversation-1',
    title: "Conversa com Agente de Vídeos de Vendas",
    type: "Conversa",
    date: new Date(Date.now() - 172800000).toLocaleDateString('pt-BR'),
    status: "Concluído",
    performance: "Em análise",
    source: 'conversation',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    conversation_data: {
      agent_name: "Agente de Vídeos de Vendas",
      agent_id: "sales-video",
      message_count: 8
    },
    content: {
      conversation: {
        messages: [
          {
            role: "user",
            content: "Preciso criar um script para um VSL sobre um curso de marketing digital",
            timestamp: new Date(Date.now() - 172800000).toISOString()
          },
          {
            role: "assistant", 
            content: "Perfeito! Vou te ajudar a criar um script de VSL envolvente para seu curso de marketing digital. Primeiro, me conte mais sobre seu público-alvo e qual é o principal problema que seu curso resolve...",
            timestamp: new Date(Date.now() - 172700000).toISOString()
          }
        ],
        agent_name: "Agente de Vídeos de Vendas",
        product_name: "Curso de Marketing Digital"
      }
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

      // Buscar conversas do chat
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('chat_sessions')
        .select(`
          *,
          chat_messages(
            id,
            role,
            content,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (productsError) {
        throw productsError;
      }

      if (quizError) {
        throw quizError;
      }

      if (conversationsError) {
        throw conversationsError;
      }

      const transformedData: CopyHistoryItem[] = [];

      // Transformar dados dos produtos
      productsData?.forEach(product => {
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
            created_at: copy.created_at,
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

        let safeQuizAnswers: Record<string, string> = {};
        if (quizCopy.quiz_answers && typeof quizCopy.quiz_answers === 'object' && !Array.isArray(quizCopy.quiz_answers)) {
          safeQuizAnswers = quizCopy.quiz_answers as Record<string, string>;
        }

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
          created_at: quizCopy.created_at,
          quiz_type: quizCopy.quiz_type,
          quiz_answers: safeQuizAnswers,
          content: {
            quiz_content: quizContent
          }
        });
      });

      // Transformar dados das conversas
      conversationsData?.forEach(conversation => {
        const messages = Array.isArray(conversation.chat_messages) 
          ? conversation.chat_messages.map(msg => ({
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
              timestamp: msg.created_at
            }))
          : [];

        // Buscar nome do produto se houver product_id
        const relatedProduct = productsData?.find(p => p.id === conversation.product_id);

        transformedData.push({
          id: conversation.id,
          title: conversation.title || `Conversa com ${conversation.agent_name}`,
          type: 'Conversa',
          date: new Date(conversation.updated_at).toLocaleDateString('pt-BR'),
          status: 'Concluído',
          performance: 'Em análise',
          source: 'conversation',
          created_at: conversation.created_at,
          updated_at: conversation.updated_at,
          conversation_data: {
            agent_name: conversation.agent_name,
            agent_id: conversation.agent_id,
            product_id: conversation.product_id,
            message_count: conversation.message_count
          },
          content: {
            conversation: {
              messages,
              agent_name: conversation.agent_name,
              product_name: relatedProduct?.name
            }
          },
          product: relatedProduct ? {
            name: relatedProduct.name,
            niche: relatedProduct.niche,
            sub_niche: relatedProduct.sub_niche
          } : undefined
        });
      });

      // Ordenar por data (mais recente primeiro) usando a data de criação ou atualização
      transformedData.sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at || a.date.split('/').reverse().join('-'));
        const dateB = new Date(b.updated_at || b.created_at || b.date.split('/').reverse().join('-'));
        return dateB.getTime() - dateA.getTime();
      });

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
