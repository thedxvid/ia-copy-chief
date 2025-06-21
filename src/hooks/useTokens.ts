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

const MONTHLY_TOKENS_LIMIT = 100000; // 100k tokens
const AUTO_REFRESH_INTERVAL = 30000; // 30 segundos
const NOTIFICATION_COOLDOWN = 24 * 60 * 60 * 1000; // 24 horas em ms

// ... existing code ...
const AUTO_REFRESH_INTERVAL = 30000; // 30 segundos
const NOTIFICATION_COOLDOWN = 24 * 60 * 60 * 1000; // 24 horas em ms
const TOKEN_CACHE_KEY = 'tokenDataCache';

export const useTokens = () => {
  const [tokens, setTokens] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationFlags, setNotificationFlags] = useState<NotificationFlags | null>(null);
  const [lastResetDate, setLastResetDate] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [lastNotificationTime, setLastNotificationTime] = useState<{ [key: string]: number }>({});
  const { user } = useAuth();

  // ... (código anterior)

  const fetchTokens = useCallback(async (showRefreshing = false) => {
    //
    //  SELECIONE TUDO AQUI DENTRO...
    //
    //  ...ATÉ ESTA LINHA ABAIXO
  }, [user?.id]);


  // NÃO SELECIONE DAQUI PARA BAIXO
  const checkAndShowNotifications = useCallback((tokenData: TokenData, flags: NotificationFlags | null) => {
    if (!tokenData || !flags) return;
    // ... resto do código

  const checkAndShowNotifications = useCallback((tokenData: TokenData, flags: NotificationFlags | null) => {
    if (!tokenData || !flags) return;

    const now = Date.now();
    const usagePercentage = ((MONTHLY_TOKENS_LIMIT - tokenData.total_available) / MONTHLY_TOKENS_LIMIT) * 100;
    
    // Verificar se tokens acabaram - mostrar popup imediatamente
    if (tokenData.total_available === 0) {
      const lastZeroNotification = lastNotificationTime['zero'] || 0;
      if (now - lastZeroNotification > NOTIFICATION_COOLDOWN) {
        setShowUpgradeModal(true);
        setLastNotificationTime(prev => ({ ...prev, zero: now }));
        
        // Atualizar flag no banco
        supabase
          .from('profiles')
          .update({ notified_90: true })
          .eq('id', user?.id);
      }
      return;
    }
    
    // Notificação 90% usado (crítico) - mostrar popup
    if (usagePercentage >= 90 && !flags.notified_90) {
      const lastCriticalNotification = lastNotificationTime['critical'] || 0;
      if (now - lastCriticalNotification > NOTIFICATION_COOLDOWN) {
        setShowUpgradeModal(true);
        setLastNotificationTime(prev => ({ ...prev, critical: now }));
        
        toast.warning('⚠️ Tokens Críticos!', {
          description: `Você usou 90% dos seus tokens mensais. Restam apenas ${tokenData.total_available.toLocaleString()} tokens.`,
          duration: 8000,
        });
        
        // Atualizar flag no banco
        supabase
          .from('profiles')
          .update({ notified_90: true })
          .eq('id', user?.id);
      }
    }
    // Notificação 50% usado (atenção)
    else if (usagePercentage >= 50 && !flags.notified_50) {
      const lastWarningNotification = lastNotificationTime['warning'] || 0;
      if (now - lastWarningNotification > NOTIFICATION_COOLDOWN) {
        toast.info('📊 Meio Caminho', {
          description: `Você já usou metade dos seus tokens mensais. Restam ${tokenData.total_available.toLocaleString()} tokens.`,
          duration: 6000,
        });
        
        setLastNotificationTime(prev => ({ ...prev, warning: now }));
        
        // Atualizar flag no banco
        supabase
          .from('profiles')
          .update({ notified_50: true })
          .eq('id', user?.id);
      }
    }
    // Notificação 10% restantes (primeiro aviso)
    else if (usagePercentage >= 10 && !flags.notified_10) {
      const lastInfoNotification = lastNotificationTime['info'] || 0;
      if (now - lastInfoNotification > NOTIFICATION_COOLDOWN) {
        toast.success('💡 Primeiros 10% Usados', {
          description: `Você começou a usar seus tokens mensais. Restam ${tokenData.total_available.toLocaleString()} tokens.`,
          duration: 4000,
        });
        
        setLastNotificationTime(prev => ({ ...prev, info: now }));
        
        // Atualizar flag no banco
        supabase
          .from('profiles')
          .update({ notified_10: true })
          .eq('id', user?.id);
      }
    }
  }, [lastNotificationTime, user?.id]);

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

  // Configurar subscription em tempo real
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔄 Configurando subscription de tokens para usuário:', user.id);

    const channelName = `tokens-${user.id}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔄 Token profile atualizado em tempo real:', payload);
          
          // Verificar se os campos de token foram alterados
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          
          const tokenFieldsChanged = 
            newRecord.monthly_tokens !== oldRecord.monthly_tokens ||
            newRecord.extra_tokens !== oldRecord.extra_tokens ||
            newRecord.total_tokens_used !== oldRecord.total_tokens_used;

          if (tokenFieldsChanged) {
            console.log('💰 Tokens alterados, atualizando estado...');
            fetchTokens(true);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Status da subscription de tokens:', status);
      });

    return () => {
      console.log('🧹 Limpando subscription de tokens');
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchTokens]);

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

  const getMonthlyLimit = useCallback(() => MONTHLY_TOKENS_LIMIT, []);

  return {
    tokens,
    loading,
    error,
    notificationFlags,
    lastResetDate,
    lastUpdate,
    isRefreshing,
    showUpgradeModal,
    setShowUpgradeModal,
    refreshTokens: fetchTokens,
    getUsagePercentage: useCallback(() => {
      if (!tokens) return 0;
      const totalTokens = tokens.monthly_tokens + tokens.extra_tokens;
      if (totalTokens === 0) return 100;
      return Math.round((tokens.total_available / totalTokens) * 100);
    }, [tokens]),
    getStatusColor: useCallback(() => {
      if (!tokens) return 'text-gray-500';
      const percentage = Math.round((tokens.total_available / (tokens.monthly_tokens + tokens.extra_tokens)) * 100);
      if (percentage > 50) return 'text-green-500';
      if (percentage > 20) return 'text-yellow-500';
      return 'text-red-500';
    }, [tokens]),
    getStatusMessage: useCallback(() => {
      if (!tokens) return 'Carregando...';
      
      const percentage = Math.round((tokens.total_available / (tokens.monthly_tokens + tokens.extra_tokens)) * 100);
      const usagePercentage = 100 - percentage;
      
      if (usagePercentage < 10) return 'Excelente';
      if (usagePercentage < 50) return 'Bom';
      if (usagePercentage < 90) return 'Atenção';
      if (percentage > 0) return 'Crítico';
      return 'Esgotado';
    }, [tokens]),
    shouldShowLowTokenWarning: useCallback(() => {
      if (!tokens) return false;
      const percentage = Math.round((tokens.total_available / (tokens.monthly_tokens + tokens.extra_tokens)) * 100);
      return percentage < 20;
    }, [tokens]),
    getRemainingDaysEstimate: useCallback(() => {
      if (!tokens) return null;
      
      const totalUsed = MONTHLY_TOKENS_LIMIT - tokens.total_available;
      const daysInMonth = new Date().getDate();
      const avgDailyUsage = daysInMonth > 0 ? totalUsed / daysInMonth : 1000;
      
      if (avgDailyUsage <= 0) return 30;
      
      const remainingDays = Math.floor(tokens.total_available / avgDailyUsage);
      return Math.max(0, remainingDays);
    }, [tokens]),
    getTokensForFeature: useCallback((feature: 'chat' | 'copy' | 'complex_copy') => {
      const estimates = {
        chat: 300,
        copy: 1500,
        complex_copy: 3000
      };
      return estimates[feature];
    }, []),
    canAffordFeature: useCallback((feature: 'chat' | 'copy' | 'complex_copy') => {
      if (!tokens) return false;
      const estimates = {
        chat: 300,
        copy: 1500,
        complex_copy: 3000
      };
      return tokens.total_available >= estimates[feature];
    }, [tokens]),
    getMonthlyLimit,
    getDaysUntilReset,
    getMonthlyUsageProgress,
  };
};
