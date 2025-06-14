
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PerformanceMetric {
  id: string;
  product_id: string;
  product_name: string;
  copy_type: string;
  conversion_rate: number | null;
  ctr: number | null;
  sales_generated: number | null;
  engagement_rate: number | null;
  roi_real: number | null;
  impressions: number | null;
  campaign_start: string | null;
  campaign_end: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  copy_efficiency_score: number | null;
}

interface PerformanceInput {
  product_id: string;
  conversion_rate?: number;
  ctr?: number;
  sales_generated?: number;
  engagement_rate?: number;
  roi_real?: number;
  impressions?: number;
  campaign_start?: string;
  campaign_end?: string;
  notes?: string;
}

export const usePerformanceAnalytics = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchAnalytics = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('product_analytics')
        .select(`
          *,
          products!inner(
            id,
            name,
            user_id
          )
        `)
        .eq('products.user_id', user.id);

      if (fetchError) throw fetchError;

      const transformedMetrics = data?.map(item => ({
        ...item,
        product_name: item.products?.name || 'Produto sem nome',
        copy_type: 'Copy Geral' // Implementar lógica para determinar tipo
      })) || [];

      setMetrics(transformedMetrics);
    } catch (err) {
      console.error('Erro ao buscar analytics:', err);
      setError('Erro ao carregar dados de performance');
    } finally {
      setLoading(false);
    }
  };

  const addMetrics = async (data: PerformanceInput) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('product_analytics')
        .insert({
          ...data,
          status: 'active'
        });

      if (error) throw error;

      await fetchAnalytics();
      return true;
    } catch (err) {
      console.error('Erro ao adicionar métricas:', err);
      setError('Erro ao salvar métricas');
      return false;
    }
  };

  const updateMetrics = async (id: string, data: Partial<PerformanceInput>) => {
    try {
      const { error } = await supabase
        .from('product_analytics')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      await fetchAnalytics();
      return true;
    } catch (err) {
      console.error('Erro ao atualizar métricas:', err);
      setError('Erro ao atualizar métricas');
      return false;
    }
  };

  const getTopPerformers = () => {
    return metrics
      .filter(m => m.conversion_rate !== null || m.roi_real !== null)
      .sort((a, b) => {
        const scoreA = (a.conversion_rate || 0) + (a.roi_real || 0) / 100;
        const scoreB = (b.conversion_rate || 0) + (b.roi_real || 0) / 100;
        return scoreB - scoreA;
      })
      .slice(0, 10);
  };

  const getInsights = () => {
    const totalMetrics = metrics.filter(m => m.conversion_rate !== null);
    if (totalMetrics.length === 0) return null;

    const avgConversion = totalMetrics.reduce((sum, m) => sum + (m.conversion_rate || 0), 0) / totalMetrics.length;
    const avgROI = totalMetrics.reduce((sum, m) => sum + (m.roi_real || 0), 0) / totalMetrics.length;
    const bestPerformer = getTopPerformers()[0];

    return {
      avgConversion: avgConversion.toFixed(2),
      avgROI: avgROI.toFixed(2),
      totalCampaigns: totalMetrics.length,
      bestPerformer
    };
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user]);

  return {
    metrics,
    loading,
    error,
    addMetrics,
    updateMetrics,
    getTopPerformers,
    getInsights,
    refetch: fetchAnalytics
  };
};
