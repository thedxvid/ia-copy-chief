
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
  };
  product?: {
    name: string;
    niche: string;
    sub_niche?: string;
  };
}

export const useCopyHistory = () => {
  const [historyItems, setHistoryItems] = useState<CopyHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchCopyHistory();
  }, [user]);

  const fetchCopyHistory = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Buscar produtos do usuário junto com suas copies
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

      if (productsError) {
        throw productsError;
      }

      // Transformar os dados em formato do histórico
      const transformedData: CopyHistoryItem[] = [];

      productsData?.forEach(product => {
        product.product_copy?.forEach(copy => {
          // Determinar o tipo de copy baseado no conteúdo disponível
          let type = 'Copy Geral';
          if (copy.landing_page_copy) type = 'Landing Page';
          else if (copy.email_campaign) type = 'Email';
          else if (copy.vsl_script) type = 'Script';
          else if (copy.whatsapp_messages?.length) type = 'WhatsApp';
          else if (copy.social_media_content) type = 'Social Media';

          // Simular performance e status (já que não temos esses dados ainda)
          const performances = ['Alta conversão', 'Média conversão', 'Baixa conversão', 'Em análise'];
          const statuses = ['Concluído', 'Em teste', 'Rascunho'];
          
          transformedData.push({
            id: copy.id,
            title: `Copy para ${product.name} - ${type}`,
            type,
            date: new Date(copy.created_at).toLocaleDateString('pt-BR'),
            status: statuses[Math.floor(Math.random() * statuses.length)],
            performance: performances[Math.floor(Math.random() * performances.length)],
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

      // Se não houver dados reais, usar dados de exemplo
      if (transformedData.length === 0) {
        setHistoryItems([
          {
            id: '1',
            title: "Copy para Landing Page - Produto X",
            type: "Landing Page",
            date: "10/06/2024",
            status: "Concluído",
            performance: "Alta conversão",
            content: {
              landing_page_copy: {
                headline: "Transforme sua vida em 30 dias",
                subheadline: "Descubra o método que já mudou a vida de mais de 10.000 pessoas",
                cta: "Quero começar agora!"
              }
            },
            product: {
              name: "Produto X",
              niche: "Desenvolvimento Pessoal",
              sub_niche: "Produtividade"
            }
          },
          {
            id: '2',
            title: "Headlines para Campanha Facebook",
            type: "Headlines",
            date: "09/06/2024",
            status: "Em teste",
            performance: "Em análise",
            content: {
              social_media_content: {
                headlines: [
                  "🚀 Você está pronto para mudar sua vida?",
                  "💡 O segredo que 97% das pessoas não conhece",
                  "⚡ Resultados em apenas 7 dias - Garantido!"
                ]
              }
            },
            product: {
              name: "Curso Online",
              niche: "Marketing Digital",
              sub_niche: "Facebook Ads"
            }
          },
          {
            id: '3',
            title: "Script de Vendas - Webinar",
            type: "Script",
            date: "08/06/2024",
            status: "Concluído",
            performance: "Média conversão",
            content: {
              vsl_script: "Olá, meu nome é João e hoje vou revelar para você o sistema exato que me permitiu sair do zero e chegar aos 6 dígitos em apenas 12 meses..."
            },
            product: {
              name: "Webinar de Vendas",
              niche: "Negócios Online",
              sub_niche: "Vendas"
            }
          },
          {
            id: '4',
            title: "Email Marketing - Promoção",
            type: "Email",
            date: "07/06/2024",
            status: "Concluído",
            performance: "Baixa conversão",
            content: {
              email_campaign: {
                subject: "🔥 Últimas vagas - 50% OFF",
                body: "Olá! Esta é sua última chance de garantir acesso ao nosso curso com 50% de desconto...",
                cta: "Quero minha vaga!"
              }
            },
            product: {
              name: "Curso de Email Marketing",
              niche: "Marketing Digital",
              sub_niche: "Email Marketing"
            }
          }
        ]);
      } else {
        setHistoryItems(transformedData);
      }
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
      setError('Erro ao carregar histórico de copies');
      // Em caso de erro, usar dados de exemplo
      setHistoryItems([
        {
          id: '1',
          title: "Copy para Landing Page - Produto X",
          type: "Landing Page",
          date: "10/06/2024",
          status: "Concluído",
          performance: "Alta conversão",
          content: {
            landing_page_copy: {
              headline: "Transforme sua vida em 30 dias",
              subheadline: "Descubra o método que já mudou a vida de mais de 10.000 pessoas",
              cta: "Quero começar agora!"
            }
          },
          product: {
            name: "Produto X",
            niche: "Desenvolvimento Pessoal",
            sub_niche: "Produtividade"
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return {
    historyItems,
    loading,
    error,
    refetch: fetchCopyHistory,
  };
};
