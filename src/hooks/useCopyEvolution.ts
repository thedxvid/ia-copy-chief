
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CopyEvolutionItem {
  id: string;
  productName: string;
  copyType: string;
  score: number;
  date: string;
  color: string;
}

const getCopyType = (copy: any) => {
  if (copy.landing_page_copy) return 'Landing Page';
  if (copy.email_campaign) return 'Email';
  if (copy.vsl_script) return 'VSL';
  if (copy.whatsapp_messages?.length) return 'WhatsApp';
  if (copy.social_media_content) return 'Social Media';
  return 'Copy Geral';
};

const getTypeColor = (type: string) => {
  const colors = {
    'Landing Page': '#3B82F6',
    'Email': '#10B981',
    'VSL': '#F59E0B',
    'WhatsApp': '#8B5CF6',
    'Social Media': '#EF4444',
    'Copy Geral': '#6B7280'
  };
  return colors[type as keyof typeof colors] || '#6B7280';
};

const calculateCopyScore = (copy: any, type: string) => {
  // Algoritmo simples para calcular score baseado no conteúdo
  let score = 50; // Base score
  
  if (type === 'Landing Page' && copy.landing_page_copy) {
    const content = copy.landing_page_copy;
    if (content.headline?.length > 30) score += 10;
    if (content.subheadline?.length > 50) score += 10;
    if (content.body?.length > 200) score += 15;
    if (content.cta?.length > 5) score += 10;
    if (content.headline?.includes('!')) score += 5;
  } else if (type === 'Email' && copy.email_campaign) {
    const content = copy.email_campaign;
    if (content.subject?.length > 20) score += 15;
    if (content.body?.length > 150) score += 15;
    if (content.subject?.includes('🔥') || content.subject?.includes('💎')) score += 10;
  } else if (type === 'VSL' && copy.vsl_script) {
    const wordCount = copy.vsl_script.split(' ').length;
    if (wordCount > 100) score += 20;
    if (wordCount > 300) score += 10;
  } else if (type === 'WhatsApp' && copy.whatsapp_messages) {
    const totalLength = copy.whatsapp_messages.join(' ').length;
    if (totalLength > 200) score += 15;
    if (copy.whatsapp_messages.length >= 3) score += 15;
  }
  
  return Math.min(100, Math.max(0, score));
};

const getExampleData = (): CopyEvolutionItem[] => [
  {
    id: '1',
    productName: 'Curso Marketing Digital',
    copyType: 'Landing Page',
    score: 85,
    date: '2024-06-01',
    color: '#3B82F6'
  },
  {
    id: '2',
    productName: 'Método Emagrecimento',
    copyType: 'Email',
    score: 78,
    date: '2024-06-03',
    color: '#10B981'
  },
  {
    id: '3',
    productName: 'Webinar Investimentos',
    copyType: 'VSL',
    score: 92,
    date: '2024-06-05',
    color: '#F59E0B'
  },
  {
    id: '4',
    productName: 'Coaching Relacionamentos',
    copyType: 'WhatsApp',
    score: 73,
    date: '2024-06-07',
    color: '#8B5CF6'
  },
  {
    id: '5',
    productName: 'Curso Dev. Pessoal',
    copyType: 'Social Media',
    score: 88,
    date: '2024-06-10',
    color: '#EF4444'
  },
  {
    id: '6',
    productName: 'Curso Marketing Digital v2',
    copyType: 'Landing Page',
    score: 94,
    date: '2024-06-12',
    color: '#3B82F6'
  },
  {
    id: '7',
    productName: 'Método Emagrecimento v2',
    copyType: 'Email',
    score: 89,
    date: '2024-06-14',
    color: '#10B981'
  }
];

export const useCopyEvolution = () => {
  const [evolutionData, setEvolutionData] = useState<CopyEvolutionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingExampleData, setIsUsingExampleData] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchEvolutionData();
  }, [user]);

  const fetchEvolutionData = async () => {
    if (!user) {
      setLoading(false);
      setIsUsingExampleData(true);
      setEvolutionData(getExampleData());
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          name,
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
        .order('created_at', { ascending: false })
        .limit(15);

      if (productsError) {
        throw productsError;
      }

      const transformedData: CopyEvolutionItem[] = [];

      productsData?.forEach(product => {
        product.product_copy?.forEach(copy => {
          const copyType = getCopyType(copy);
          const score = calculateCopyScore(copy, copyType);
          const color = getTypeColor(copyType);

          transformedData.push({
            id: copy.id,
            productName: product.name,
            copyType,
            score,
            date: new Date(copy.created_at).toISOString().split('T')[0],
            color
          });
        });
      });

      // Ordenar por data
      transformedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (transformedData.length === 0) {
        setEvolutionData(getExampleData());
        setIsUsingExampleData(true);
      } else {
        setEvolutionData(transformedData);
        setIsUsingExampleData(false);
      }
    } catch (err) {
      console.error('Erro ao buscar dados de evolução:', err);
      setError('Erro ao carregar dados de evolução');
      setEvolutionData(getExampleData());
      setIsUsingExampleData(true);
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    if (evolutionData.length === 0) {
      return {
        averageScore: 0,
        bestScore: 0,
        bestType: 'N/A',
        streak: 0
      };
    }

    const scores = evolutionData.map(item => item.score);
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const bestScore = Math.max(...scores);
    
    // Tipo com melhor performance média
    const typeScores: { [key: string]: number[] } = {};
    evolutionData.forEach(item => {
      if (!typeScores[item.copyType]) typeScores[item.copyType] = [];
      typeScores[item.copyType].push(item.score);
    });
    
    let bestType = 'N/A';
    let bestTypeAverage = 0;
    Object.entries(typeScores).forEach(([type, scores]) => {
      const average = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (average > bestTypeAverage) {
        bestTypeAverage = average;
        bestType = type;
      }
    });

    // Streak de copies criadas (últimos 7 dias)
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const streak = evolutionData.filter(item => 
      new Date(item.date) >= sevenDaysAgo
    ).length;

    return {
      averageScore,
      bestScore,
      bestType,
      streak
    };
  };

  return {
    evolutionData,
    loading,
    error,
    isUsingExampleData,
    stats: getStats(),
    refetch: fetchEvolutionData,
  };
};
