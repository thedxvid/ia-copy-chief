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

interface CacheData {
  tokens: TokenData;
  notificationFlags: NotificationFlags;
  lastResetDate: string | null;
  timestamp: number;
}

const MONTHLY_TOKENS_LIMIT = 100000; // 100k tokens
const AUTO_REFRESH_INTERVAL = 3000; // Reduzido para 3 segundos para máxima responsividade
const NOTIFICATION_COOLDOWN = 24 * 60 * 60 * 1000; // 24 horas em ms
const CACHE_EXPIRY_TIME = 15 * 1000; // Reduzido para 15 segundos para máxima atualização

export const useTokens = () => {
  const [tokens, setTokens] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationFlags, setNotificationFlags] = useState<NotificationFlags | null>(null);
  const [lastResetDate, setLastResetDate] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showExhaustedModal, setShowExhaustedModal] = useState(false);
  const [lastNotificationTime, setLastNotificationTime] = useState<{ [key: string]: number }>({});
  const [exhaustedModalDismissed, setExhaustedModalDismissed] = useState(false);
  const { user } = useAuth();

  // Função para obter a chave do cache específica do usuário
  const getCacheKey = useCallback(() => {
    return user?.id ? `tokenDataCache_${user.id}` : 'tokenDataCache_anonymous';
  }, [user?.id]);

  // Função para obter a chave do dismissal do modal
  const getExhaustedModalDismissalKey = useCallback(() => {
    return user?.id ? `exhaustedModalDismissed_${user.id}` : 'exhaustedModalDismissed_anonymous';
  }, [user?.id]);

  // Função para verificar se o modal foi dispensado
  const isExhaustedModalDismissed = useCallback(() => {
    try {
      const dismissalKey = getExhaustedModalDismissalKey();
      const dismissedUntil = localStorage.getItem(dismissalKey);
      
      if (!dismissedUntil) return false;
      
      const dismissedTimestamp = parseInt(dismissedUntil);
      const now = Date.now();
      
      // Verificar se ainda está no período de dismissal (até próxima renovação ou 30 dias)
      return now < dismissedTimestamp;
    } catch (error) {
      console.warn('Erro ao verificar dismissal do modal:', error);
      return false;
    }
  }, [getExhaustedModalDismissalKey]);

  // Função para marcar o modal como dispensado
  const dismissExhaustedModal = useCallback(() => {
    try {
      const dismissalKey = getExhaustedModalDismissalKey();
      // Dispensar por 30 dias ou até próxima renovação
      const dismissUntil = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 dias
      localStorage.setItem(dismissalKey, dismissUntil.toString());
      setExhaustedModalDismissed(true);
      console.log('🔕 Modal de tokens esgotados dispensado até:', new Date(dismissUntil).toLocaleString());
    } catch (error) {
      console.warn('Erro ao dispensar modal:', error);
    }
  }, [getExhaustedModalDismissalKey]);

  // Função para limpar o dismissal (quando tokens são renovados)
  const clearExhaustedModalDismissal = useCallback(() => {
    try {
      const dismissalKey = getExhaustedModalDismissalKey();
      localStorage.removeItem(dismissalKey);
      setExhaustedModalDismissed(false);
      console.log('🔔 Dismissal do modal de tokens esgotados limpo');
    } catch (error) {
      console.warn('Erro ao limpar dismissal do modal:', error);
    }
  }, [getExhaustedModalDismissalKey]);

  // Função para obter a chave do cache específica do usuário
  const getCacheKey = useCallback(() => {
    return user?.id ? `tokenDataCache_${user.id}` : 'tokenDataCache_anonymous';
  }, [user?.id]);

  // Função para ler dados do cache
  const readFromCache = useCallback((): CacheData | null => {
    if (!user?.id) return null;
    
    try {
      const cacheKey = getCacheKey();
      const cachedDataString = localStorage.getItem(cacheKey);
      
      if (!cachedDataString) return null;
      
      const cachedData: CacheData = JSON.parse(cachedDataString);
      const now = Date.now();
      
      // Verificar se o cache não expirou
      if (now - cachedData.timestamp > CACHE_EXPIRY_TIME) {
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      return cachedData;
    } catch (error) {
      console.warn('Erro ao ler cache de tokens:', error);
      try {
        localStorage.removeItem(getCacheKey());
      } catch (e) {
        console.warn('Erro ao remover cache corrompido:', e);
      }
      return null;
    }
  }, [user?.id, getCacheKey]);

  // Função para salvar dados no cache
  const saveToCache = useCallback((tokenData: TokenData, flags: NotificationFlags | null, resetDate: string | null) => {
    if (!user?.id) return;
    
    try {
      const cacheKey = getCacheKey();
      const cacheData: CacheData = {
        tokens: tokenData,
        notificationFlags: flags || { notified_90: false, notified_50: false, notified_10: false },
        lastResetDate: resetDate,
        timestamp: Date.now()
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log('✅ Cache salvo com sucesso:', { 
        totalAvailable: tokenData.total_available,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.warn('Erro ao salvar cache de tokens:', error);
    }
  }, [user?.id, getCacheKey]);

  // Função robusta para buscar tokens com fallback
  const fetchTokens = useCallback(async (showRefreshing = false, forceUpdate = false) => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else if (!forceUpdate) {
        setLoading(true);
      }
      setError(null);
      
      console.log('🔄 Iniciando busca de tokens para usuário:', user.id);
      
      // TENTATIVA 1: Usar a função RPC corrigida
      let tokensData = null;
      let usedRpcFunction = false;
      
      try {
        console.log('🔒 Tentando usar função RPC check_token_balance corrigida...');
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('check_token_balance', { p_user_id: user.id });

        if (!rpcError && rpcData && rpcData.length > 0) {
          tokensData = rpcData[0];
          usedRpcFunction = true;
          console.log('✅ RPC check_token_balance (CORRIGIDA) funcionou:', tokensData);
        } else {
          console.warn('⚠️ RPC check_token_balance falhou:', rpcError);
        }
      } catch (rpcError) {
        console.warn('⚠️ Erro na RPC check_token_balance:', rpcError);
      }

      // TENTATIVA 2: Fallback para consulta SQL direta COM CÁLCULO CORRETO
      if (!tokensData) {
        console.log('🔄 Usando fallback: consulta SQL direta ao profiles com cálculo correto...');
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('monthly_tokens, extra_tokens, total_tokens_used')
            .eq('id', user.id)
            .single();

          if (!profileError && profileData) {
            // CORREÇÃO: Usar o mesmo cálculo da função RPC corrigida
            const monthlyTokens = profileData.monthly_tokens || 0;
            const extraTokens = profileData.extra_tokens || 0;
            const totalUsed = profileData.total_tokens_used || 0;
            const totalAvailable = Math.max(0, monthlyTokens + extraTokens - totalUsed);
            
            tokensData = {
              monthly_tokens: monthlyTokens,
              extra_tokens: extraTokens,
              total_available: totalAvailable,
              total_used: totalUsed
            };
            console.log('✅ Fallback SQL (CORRIGIDO) funcionou:', tokensData);
          } else {
            console.error('❌ Fallback SQL falhou:', profileError);
            throw profileError;
          }
        } catch (fallbackError) {
          console.error('❌ Erro no fallback SQL:', fallbackError);
          throw fallbackError;
        }
      }

      // Buscar flags de notificação e data de reset
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('notified_90, notified_50, notified_10, tokens_reset_date')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.warn('Erro ao buscar flags de notificação:', profileError);
      }

      if (tokensData) {
        const flags = profileData || { notified_90: false, notified_50: false, notified_10: false };
        const resetDate = profileData?.tokens_reset_date || null;
        
        console.log('📊 Tokens atualizados (VALORES CORRETOS):', {
          totalAvailable: tokensData.total_available,
          monthlyTokens: tokensData.monthly_tokens,
          extraTokens: tokensData.extra_tokens,
          totalUsed: tokensData.total_used,
          calculation: `${tokensData.monthly_tokens} + ${tokensData.extra_tokens} - ${tokensData.total_used} = ${tokensData.total_available}`,
          method: usedRpcFunction ? 'RPC_CORRIGIDA' : 'SQL_DIRETO_CORRIGIDO',
          timestamp: new Date().toLocaleTimeString()
        });
        
        // Se tokens foram renovados (não são mais zero), limpar dismissal
        if (tokensData.total_available > 0 && exhaustedModalDismissed) {
          clearExhaustedModalDismissal();
        }
        
        setTokens(tokensData);
        setNotificationFlags(flags);
        setLastResetDate(resetDate);
        setLastUpdate(new Date());
        
        // Salvar no cache após buscar dados do servidor
        saveToCache(tokensData, flags, resetDate);
        
        // Verificar se precisa mostrar notificações ou popup
        checkAndShowNotifications(tokensData, flags);
      } else {
        console.error('❌ Nenhum dado de token encontrado');
        setError('Dados de tokens não encontrados');
      }
    } catch (err) {
      console.error('❌ Erro crítico ao buscar tokens:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar tokens');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, saveToCache, exhaustedModalDismissed, clearExhaustedModalDismissal]);

  const checkAndShowNotifications = useCallback((tokenData: TokenData, flags: NotificationFlags | null) => {
    if (!tokenData || !flags) return;

    const now = Date.now();
    const usagePercentage = ((MONTHLY_TOKENS_LIMIT - tokenData.total_available) / MONTHLY_TOKENS_LIMIT) * 100;
    
    // Verificar se tokens acabaram - mostrar modal específico para tokens zerados
    if (tokenData.total_available === 0) {
      // Verificar se o modal foi dispensado
      if (isExhaustedModalDismissed()) {
        console.log('🔕 Modal de tokens esgotados dispensado - não mostrando');
        return;
      }
      
      const lastZeroNotification = lastNotificationTime['zero'] || 0;
      if (now - lastZeroNotification > NOTIFICATION_COOLDOWN) {
        setShowExhaustedModal(true);
        setLastNotificationTime(prev => ({ ...prev, zero: now }));
        
        // Atualizar flag no banco
        supabase
          .from('profiles')
          .update({ notified_90: true })
          .eq('id', user?.id);
      }
      return;
    }
    
    // Notificação 90% usado (crítico) - mostrar popup de upgrade
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
  }, [lastNotificationTime, user?.id, isExhaustedModalDismissed]);

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
          fetchTokens(false, true);
        }
      } catch (err) {
        console.warn('Reset automático não disponível:', err);
      }
    }
  }, [user?.id, lastResetDate, fetchTokens]);

  // Effect principal - implementação do cache inteligente
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔄 INICIANDO carregamento de tokens para usuário:', user.id);

    // Verificar se modal foi dispensado
    setExhaustedModalDismissed(isExhaustedModalDismissed());

    // Primeiro, tentar carregar do cache
    const cachedData = readFromCache();
    
    if (cachedData) {
      console.log('💾 Cache encontrado - carregamento instantâneo');
      
      // Renderizar imediatamente com dados do cache
      setTokens(cachedData.tokens);
      setNotificationFlags(cachedData.notificationFlags);
      setLastResetDate(cachedData.lastResetDate);
      setLastUpdate(new Date(cachedData.timestamp));
      setLoading(false);
      
      // Buscar dados atualizados em segundo plano
      console.log('🔄 Atualizando dados em segundo plano...');
      fetchTokens(true, true);
    } else {
      console.log('🆕 Primeira visita ou cache expirado - carregamento completo');
      // Se não há cache, fazer carregamento normal
      fetchTokens(false, false);
    }

    // Verificar se reset é necessário
    checkResetNeeded();
  }, [user?.id, readFromCache, fetchTokens, checkResetNeeded, isExhaustedModalDismissed]);

  // MELHORADA: Configurar subscription mais robusta para atualizações em tempo real
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔄 Configurando subscriptions ULTRA-ROBUSTAS de tokens para usuário:', user.id);

    const channelName = `tokens-realtime-${user.id}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Escutar todos os eventos (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔄 Profile atualizado em tempo real (tokens):', {
            event: payload.eventType,
            old: payload.old,
            new: payload.new,
            timestamp: new Date().toLocaleTimeString()
          });
          
          // FORÇAR atualização INSTANTÂNEA quando há mudança
          console.log('💰 FORÇANDO atualização INSTANTÂNEA de tokens devido a mudança em tempo real');
          setTimeout(() => fetchTokens(true, true), 50); // Reduzido para 50ms para máxima velocidade
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
          console.log('💳 Novo uso de token detectado em tempo real:', {
            tokensUsed: payload.new?.tokens_used,
            feature: payload.new?.feature_used,
            timestamp: new Date().toLocaleTimeString()
          });
          
          // FORÇAR atualização INSTANTÂNEA quando tokens são usados
          console.log('🔄 FORÇANDO atualização INSTANTÂNEA devido a novo uso de token');
          setTimeout(() => fetchTokens(true, true), 50); // Reduzido para 50ms para máxima velocidade
        }
      )
      .subscribe((status) => {
        console.log('📡 Status da subscription ULTRA-ROBUSTA de tokens:', status);
      });

    return () => {
      console.log('🧹 Limpando subscription ULTRA-ROBUSTA de tokens');
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchTokens]);

  // Auto-refresh quando a aba voltar a ficar ativa
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.id) {
        console.log('👁️ Aba ativa - atualizando tokens');
        fetchTokens(true, true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchTokens, user?.id]);

  // Auto-refresh mais frequente quando ativo
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      if (!document.hidden) {
        console.log('🔄 Auto-refresh tokens (3 segundos)');
        fetchTokens(true, true);
      }
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchTokens, user?.id]);

  // MELHORADO: Listener para mudanças no localStorage (para sincronizar entre abas)
  useEffect(() => {
    if (!user?.id) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === getCacheKey()) {
        console.log('💾 Cache alterado em outra aba - sincronizando');
        const cachedData = readFromCache();
        if (cachedData) {
          setTokens(cachedData.tokens);
          setNotificationFlags(cachedData.notificationFlags);
          setLastResetDate(cachedData.lastResetDate);
          setLastUpdate(new Date(cachedData.timestamp));
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user?.id, getCacheKey, readFromCache]);

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

  const handleUpgrade = useCallback(() => {
    setShowUpgradeModal(true);
  }, []);

  // Função para fechar o modal de tokens esgotados e dispensá-lo
  const handleCloseExhaustedModal = useCallback(() => {
    setShowExhaustedModal(false);
    dismissExhaustedModal();
  }, [dismissExhaustedModal]);

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
    showExhaustedModal,
    setShowExhaustedModal,
    handleUpgrade,
    handleCloseExhaustedModal,
    refreshTokens: (showRefreshing = false) => fetchTokens(showRefreshing, true),
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
