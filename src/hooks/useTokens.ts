
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

interface NotificationFlags {
  notified_90: boolean;
  notified_50: boolean;
  notified_10: boolean;
}

const MONTHLY_TOKENS_LIMIT = 25000; // Plano R$ 97
const AUTO_REFRESH_INTERVAL = 30000; // 30 segundos

export const useTokens = () => {
  const [tokens, setTokens] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationFlags, setNotificationFlags] = useState<NotificationFlags | null>(null);
  const [lastResetDate, setLastResetDate] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useAuth();

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
      
      // Buscar tokens disponíveis
      const { data: tokensData, error: tokensError } = await supabase
        .rpc('get_available_tokens', { p_user_id: user.id });

      if (tokensError) throw tokensError;

      // Buscar flags de notificação e data de reset
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('notified_90, notified_50, notified_10, tokens_reset_date')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.warn('Erro ao buscar flags de notificação:', profileError);
      }

      if (tokensData && tokensData.length > 0) {
        const tokenInfo = tokensData[0];
        setTokens(tokenInfo);
        setNotificationFlags(profileData || { notified_90: false, notified_50: false, notified_10: false });
        setLastResetDate(profileData?.tokens_reset_date || null);
        setLastUpdate(new Date());
        
        // Verificar se precisa mostrar notificações
        checkAndShowNotifications(tokenInfo, profileData);
        
        console.log('Tokens atualizados:', tokenInfo);
      } else {
        console.warn('Nenhum dado de token encontrado para o usuário');
        setError('Dados de tokens não encontrados');
      }
    } catch (err) {
      console.error('Error fetching tokens:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar tokens');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  const checkAndShowNotifications = useCallback((tokenData: TokenData, flags: NotificationFlags | null) => {
    if (!tokenData || !flags) return;

    const usagePercentage = ((MONTHLY_TOKENS_LIMIT - tokenData.total_available) / MONTHLY_TOKENS_LIMIT) * 100;
    
    // Notificação 90% usado (crítico)
    if (usagePercentage >= 90 && !flags.notified_90) {
      toast.error('⚠️ Tokens Críticos!', {
        description: `Você usou 90% dos seus tokens mensais. Restam apenas ${tokenData.total_available.toLocaleString()} tokens.`,
        duration: 8000,
      });
    }
    // Notificação 50% usado (atenção)
    else if (usagePercentage >= 50 && !flags.notified_50) {
      toast.warning('📊 Meio Caminho', {
        description: `Você já usou metade dos seus tokens mensais. Restam ${tokenData.total_available.toLocaleString()} tokens.`,
        duration: 6000,
      });
    }
    // Notificação 10% restantes (primeiro aviso)
    else if (usagePercentage >= 90 && !flags.notified_10) {
      toast.info('💡 Primeiros 10% Usados', {
        description: `Você começou a usar seus tokens mensais. Restam ${tokenData.total_available.toLocaleString()} tokens.`,
        duration: 4000,
      });
    }
  }, []);

  const checkResetNeeded = useCallback(async () => {
    if (!user?.id || !lastResetDate) return;

    const today = new Date();
    const resetDate = new Date(lastResetDate);
    const daysDiff = Math.floor((today.getTime() - resetDate.getTime()) / (1000 * 60 * 60 * 24));

    // Se passou mais de 30 dias, sugerir reset
    if (daysDiff >= 30) {
      console.log('Reset automático detectado como necessário');
      
      // Verificar se há uma função de reset disponível
      try {
        const { data, error } = await supabase.functions.invoke('monthly-token-reset');
        if (!error && data?.success) {
          toast.success('🔄 Tokens Renovados!', {
            description: 'Seus tokens mensais foram renovados automaticamente.',
            duration: 5000,
          });
          
          // Atualizar dados após reset
          fetchTokens();
        }
      } catch (err) {
        console.warn('Reset automático não disponível:', err);
      }
    }
  }, [user?.id, lastResetDate, fetchTokens]);

  // Auto-refresh quando a aba voltar a ficar ativa
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.id) {
        console.log('👁️ Aba ativa - atualizando tokens');
        fetchTokens(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchTokens, user?.id]);

  // Auto-refresh a cada 30 segundos quando ativo
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      if (!document.hidden) {
        console.log('🔄 Auto-refresh tokens');
        fetchTokens(true);
      }
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchTokens, user?.id]);

  const getDaysUntilReset = useCallback(() => {
    if (!lastResetDate) return null;
    
    const resetDate = new Date(lastResetDate);
    const nextReset = new Date(resetDate);
    nextReset.setMonth(nextReset.getMonth() + 1);
    
    const today = new Date();
    const daysUntilReset = Math.ceil((nextReset.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return Math.max(0, daysUntilReset);
  }, [lastResetDate]);

  const getMonthlyUsageProgress = useCallback(() => {
    if (!tokens) return 0;
    
    const usedTokens = MONTHLY_TOKENS_LIMIT - tokens.total_available;
    return Math.min(100, Math.max(0, (usedTokens / MONTHLY_TOKENS_LIMIT) * 100));
  }, [tokens]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  useEffect(() => {
    if (tokens && lastResetDate) {
      checkResetNeeded();
    }
  }, [tokens, lastResetDate, checkResetNeeded]);

  const refreshTokens = useCallback(() => {
    console.log('🔄 Manual refresh tokens...');
    fetchTokens(true);
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
    const usagePercentage = 100 - percentage;
    
    if (usagePercentage < 10) return 'Excelente';
    if (usagePercentage < 50) return 'Bom';
    if (usagePercentage < 90) return 'Atenção';
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
    
    const totalUsed = MONTHLY_TOKENS_LIMIT - tokens.total_available;
    const daysInMonth = new Date().getDate();
    const avgDailyUsage = daysInMonth > 0 ? totalUsed / daysInMonth : 1000;
    
    if (avgDailyUsage <= 0) return 30;
    
    const remainingDays = Math.floor(tokens.total_available / avgDailyUsage);
    return Math.max(0, remainingDays);
  }, [tokens]);

  const getTokensForFeature = useCallback((feature: 'chat' | 'copy' | 'complex_copy') => {
    const estimates = {
      chat: 300,
      copy: 1500,
      complex_copy: 3000
    };
    return estimates[feature];
  }, []);

  const canAffordFeature = useCallback((feature: 'chat' | 'copy' | 'complex_copy') => {
    if (!tokens) return false;
    return tokens.total_available >= getTokensForFeature(feature);
  }, [tokens, getTokensForFeature]);

  const getMonthlyLimit = useCallback(() => MONTHLY_TOKENS_LIMIT, []);

  return {
    tokens,
    loading,
    error,
    notificationFlags,
    lastResetDate,
    lastUpdate,
    isRefreshing,
    refreshTokens,
    getUsagePercentage,
    getStatusColor,
    getStatusMessage,
    shouldShowLowTokenWarning,
    getRemainingDaysEstimate,
    getTokensForFeature,
    canAffordFeature,
    getMonthlyLimit,
    getDaysUntilReset,
    getMonthlyUsageProgress,
  };
};
