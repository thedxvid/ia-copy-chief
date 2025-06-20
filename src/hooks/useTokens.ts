
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface TokenData {
  monthly_tokens: number;
  extra_tokens: number;
  total_available: number;
  total_used: number;
}

const MONTHLY_TOKENS_LIMIT = 25000;

export const useTokens = () => {
  const [tokens, setTokens] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useAuth();

  // Função principal para buscar tokens
  const fetchTokens = useCallback(async (showRefreshing = false) => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const { data: tokensData, error: tokensError } = await supabase
        .rpc('get_available_tokens', { p_user_id: user.id });

      if (tokensError) throw tokensError;

      if (tokensData && tokensData.length > 0) {
        const tokenInfo = tokensData[0];
        setTokens(tokenInfo);
        setLastUpdate(new Date());
        console.log('✅ Tokens atualizados em tempo real:', tokenInfo);
      } else {
        console.warn('Nenhum dado de token encontrado para o usuário');
        setError('Dados de tokens não encontrados');
      }
    } catch (err) {
      console.error('❌ Erro ao buscar tokens:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar tokens');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  // Configurar subscription em tempo real
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔄 Configurando subscription em tempo real para tokens');

    // Buscar tokens inicialmente
    fetchTokens();

    // Criar subscription para mudanças em tempo real
    const channel = supabase
      .channel(`tokens_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔔 Mudança detectada no perfil:', payload);
          fetchTokens(true); // Recarregar tokens quando houver mudanças
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'token_usage',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔔 Novo uso de token detectado:', payload);
          fetchTokens(true); // Recarregar tokens quando houver novo uso
        }
      )
      .on('broadcast', { event: 'token-consumed' }, (payload) => {
        if (payload.payload?.userId === user.id) {
          console.log('🔔 Token consumido via broadcast:', payload);
          fetchTokens(true);
        }
      })
      .subscribe((status) => {
        console.log('📡 Status da subscription:', status);
      });

    return () => {
      console.log('🛑 Removendo subscription de tokens');
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchTokens]);

  // Funções auxiliares simplificadas e consistentes
  const getUsagePercentage = useCallback(() => {
    if (!tokens) return 0;
    const used = MONTHLY_TOKENS_LIMIT - tokens.total_available;
    return Math.min(100, Math.max(0, (used / MONTHLY_TOKENS_LIMIT) * 100));
  }, [tokens]);

  const getStatusColor = useCallback(() => {
    const percentage = getUsagePercentage();
    if (percentage < 50) return 'text-green-500';
    if (percentage < 80) return 'text-yellow-500';
    return 'text-red-500';
  }, [getUsagePercentage]);

  const getStatusMessage = useCallback(() => {
    if (!tokens) return 'Carregando...';
    const percentage = getUsagePercentage();
    if (percentage < 50) return 'Excelente';
    if (percentage < 80) return 'Atenção';
    return 'Crítico';
  }, [tokens, getUsagePercentage]);

  const shouldShowLowTokenWarning = useCallback(() => {
    if (!tokens) return false;
    return getUsagePercentage() > 80;
  }, [tokens, getUsagePercentage]);

  const getMonthlyLimit = useCallback(() => MONTHLY_TOKENS_LIMIT, []);

  const getDaysUntilReset = useCallback(() => {
    // Implementação básica - pode ser expandida posteriormente
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const daysUntilReset = Math.ceil((nextMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysUntilReset);
  }, []);

  const getMonthlyUsageProgress = useCallback(() => {
    return getUsagePercentage();
  }, [getUsagePercentage]);

  const refreshTokens = useCallback(() => {
    console.log('🔄 Refresh manual solicitado');
    fetchTokens(true);
  }, [fetchTokens]);

  return {
    tokens,
    loading,
    error,
    lastUpdate,
    isRefreshing,
    refreshTokens,
    getUsagePercentage,
    getStatusColor,
    getStatusMessage,
    shouldShowLowTokenWarning,
    getMonthlyLimit,
    getDaysUntilReset,
    getMonthlyUsageProgress,
    // Funções de compatibilidade para outros hooks existentes
    getTokensForFeature: (feature: string) => {
      const estimates: { [key: string]: number } = {
        chat: 300,
        copy: 1500,
        complex_copy: 3000
      };
      return estimates[feature] || 1000;
    },
    canAffordFeature: (feature: string) => {
      if (!tokens) return false;
      const estimates: { [key: string]: number } = {
        chat: 300,
        copy: 1500,
        complex_copy: 3000
      };
      return tokens.total_available >= (estimates[feature] || 1000);
    },
    getRemainingDaysEstimate: () => {
      if (!tokens) return null;
      const usedThisMonth = MONTHLY_TOKENS_LIMIT - tokens.total_available;
      const daysInMonth = new Date().getDate();
      const avgDailyUsage = daysInMonth > 0 ? usedThisMonth / daysInMonth : 100;
      if (avgDailyUsage <= 0) return 30;
      return Math.max(0, Math.floor(tokens.total_available / avgDailyUsage));
    }
  };
};
