
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TokenData {
  monthly_tokens: number;
  extra_tokens: number;
  total_available: number;
  total_used: number;
}

export const useTokens = () => {
  const [tokens, setTokens] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTokens = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .rpc('get_available_tokens', { p_user_id: user.id });

      if (error) throw error;

      if (data && data.length > 0) {
        setTokens(data[0]);
        console.log('Tokens atualizados:', data[0]);
      } else {
        // Se não há dados, pode ser que o usuário não foi inicializado
        console.warn('Nenhum dado de token encontrado para o usuário');
        setError('Dados de tokens não encontrados');
      }
    } catch (err) {
      console.error('Error fetching tokens:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar tokens');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const refreshTokens = useCallback(() => {
    console.log('Refreshing tokens...');
    fetchTokens();
  }, [fetchTokens]);

  const getUsagePercentage = useCallback(() => {
    if (!tokens) return 0;
    const totalTokens = tokens.monthly_tokens + tokens.extra_tokens;
    if (totalTokens === 0) return 100;
    return Math.round((tokens.total_available / totalTokens) * 100);
  }, [tokens]);

  const getStatusColor = useCallback(() => {
    const percentage = getUsagePercentage();
    if (percentage > 50) return 'text-green-500';
    if (percentage > 20) return 'text-yellow-500';
    return 'text-red-500';
  }, [getUsagePercentage]);

  const getStatusMessage = useCallback(() => {
    if (!tokens) return 'Carregando...';
    
    const percentage = getUsagePercentage();
    if (percentage > 90) return 'Excelente';
    if (percentage > 50) return 'Bom';
    if (percentage > 20) return 'Atenção';
    if (percentage > 0) return 'Crítico';
    return 'Esgotado';
  }, [tokens, getUsagePercentage]);

  const shouldShowLowTokenWarning = useCallback(() => {
    if (!tokens) return false;
    const percentage = getUsagePercentage();
    return percentage < 20;
  }, [tokens, getUsagePercentage]);

  const getRemainingDaysEstimate = useCallback(() => {
    if (!tokens) return null;
    
    // Estimativa baseada no uso diário médio (muito simplificada)
    // Em uma implementação real, você calcularia baseado no histórico de uso
    const avgDailyUsage = 1000; // tokens por dia (estimativa)
    const remainingDays = Math.floor(tokens.total_available / avgDailyUsage);
    
    return Math.max(0, remainingDays);
  }, [tokens]);

  return {
    tokens,
    loading,
    error,
    refreshTokens,
    getUsagePercentage,
    getStatusColor,
    getStatusMessage,
    shouldShowLowTokenWarning,
    getRemainingDaysEstimate,
  };
};
