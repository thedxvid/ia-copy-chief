
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

const MONTHLY_TOKENS_LIMIT = 25000; // Novo limite para plano R$ 97

export const useTokens = () => {
  const [tokens, setTokens] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationFlags, setNotificationFlags] = useState<NotificationFlags | null>(null);
  const { user } = useAuth();

  const fetchTokens = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Buscar tokens disponíveis
      const { data: tokensData, error: tokensError } = await supabase
        .rpc('get_available_tokens', { p_user_id: user.id });

      if (tokensError) throw tokensError;

      // Buscar flags de notificação
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('notified_90, notified_50, notified_10')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.warn('Erro ao buscar flags de notificação:', profileError);
      }

      if (tokensData && tokensData.length > 0) {
        const tokenInfo = tokensData[0];
        setTokens(tokenInfo);
        setNotificationFlags(profileData || { notified_90: false, notified_50: false, notified_10: false });
        
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
    
    // Calcular uso médio diário baseado no histórico
    const totalUsed = MONTHLY_TOKENS_LIMIT - tokens.total_available;
    const daysInMonth = new Date().getDate(); // Dias transcorridos no mês
    const avgDailyUsage = daysInMonth > 0 ? totalUsed / daysInMonth : 1000; // Fallback conservador
    
    if (avgDailyUsage <= 0) return 30; // Se ainda não usou nada
    
    const remainingDays = Math.floor(tokens.total_available / avgDailyUsage);
    return Math.max(0, remainingDays);
  }, [tokens]);

  const getTokensForFeature = useCallback((feature: 'chat' | 'copy' | 'complex_copy') => {
    const estimates = {
      chat: 300, // Conversa média
      copy: 1500, // Copy simples
      complex_copy: 3000 // Copy complexa (VSL, landing page)
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
    refreshTokens,
    getUsagePercentage,
    getStatusColor,
    getStatusMessage,
    shouldShowLowTokenWarning,
    getRemainingDaysEstimate,
    getTokensForFeature,
    canAffordFeature,
    getMonthlyLimit,
  };
};
