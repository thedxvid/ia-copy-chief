
import { useState, useEffect, useCallback, useRef } from 'react';
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

const MONTHLY_TOKENS_LIMIT = 100000;
const CACHE_KEY = 'token_cache';
const CACHE_EXPIRY_KEY = 'token_cache_expiry';
const CACHE_DURATION = 30000; // 30 segundos
const AUTO_REFRESH_INTERVAL = 60000; // Reduzido para 60 segundos
const DEBOUNCE_DELAY = 1000;

export const useTokensOptimized = () => {
  const [tokens, setTokens] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const { user } = useAuth();
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const cacheCheckedRef = useRef(false);

  // Cache helpers
  const getCachedTokens = useCallback((): TokenData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
      
      if (cached && expiry) {
        const expiryTime = parseInt(expiry);
        if (Date.now() < expiryTime) {
          return JSON.parse(cached);
        }
      }
    } catch (error) {
      console.warn('Erro ao ler cache de tokens:', error);
    }
    return null;
  }, []);

  const setCachedTokens = useCallback((tokenData: TokenData) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(tokenData));
      localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
    } catch (error) {
      console.warn('Erro ao salvar cache de tokens:', error);
    }
  }, []);

  const clearTokenCache = useCallback(() => {
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_EXPIRY_KEY);
    } catch (error) {
      console.warn('Erro ao limpar cache:', error);
    }
  }, []);

  // Debounced fetch function
  const debouncedFetch = useCallback((showRefreshing = false) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchTokens(showRefreshing);
    }, DEBOUNCE_DELAY);
  }, []);

  const fetchTokens = useCallback(async (showRefreshing = false) => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      }
      setError(null);
      
      // Usar cache durante o carregamento se disponível
      if (!tokens && !cacheCheckedRef.current) {
        const cachedData = getCachedTokens();
        if (cachedData) {
          setTokens(cachedData);
          setLoading(false);
          console.log('🚀 Tokens carregados do cache:', cachedData);
        }
        cacheCheckedRef.current = true;
      }

      // Buscar dados atualizados
      const { data: tokensData, error: tokensError } = await supabase
        .rpc('get_available_tokens', { p_user_id: user.id });

      if (tokensError) throw tokensError;

      if (tokensData && tokensData.length > 0) {
        const tokenInfo = tokensData[0];
        setTokens(tokenInfo);
        setCachedTokens(tokenInfo);
        setLastUpdate(new Date());
        
        // Verificar notificações apenas se houve mudança significativa
        if (!tokens || Math.abs(tokens.total_available - tokenInfo.total_available) > 100) {
          checkTokenNotifications(tokenInfo);
        }
        
        console.log('💰 Tokens atualizados:', tokenInfo);
      }
    } catch (err) {
      console.error('Erro ao buscar tokens:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar tokens');
      
      // Em caso de erro, usar cache se disponível
      const cachedData = getCachedTokens();
      if (cachedData && !tokens) {
        setTokens(cachedData);
        console.log('📦 Usando cache devido ao erro');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, tokens, getCachedTokens, setCachedTokens]);

  const checkTokenNotifications = useCallback((tokenData: TokenData) => {
    if (!tokenData) return;

    const usagePercentage = ((MONTHLY_TOKENS_LIMIT - tokenData.total_available) / MONTHLY_TOKENS_LIMIT) * 100;
    
    // Tokens acabaram
    if (tokenData.total_available === 0) {
      setShowUpgradeModal(true);
      return;
    }
    
    // 90% usado (crítico)
    if (usagePercentage >= 90) {
      setShowUpgradeModal(true);
      toast.warning('⚠️ Tokens Críticos!', {
        description: `Restam apenas ${tokenData.total_available.toLocaleString()} tokens.`,
        duration: 8000,
      });
    }
    // 50% usado
    else if (usagePercentage >= 50 && usagePercentage < 90) {
      toast.info('📊 Meio Caminho', {
        description: `Você já usou metade dos tokens. Restam ${tokenData.total_available.toLocaleString()}.`,
        duration: 6000,
      });
    }
  }, []);

  // Configurar subscription otimizada
  useEffect(() => {
    if (!user?.id) return;

    const channelName = `tokens-optimized-${user.id}`;
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
          console.log('🔄 Profile atualizado:', payload);
          
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          
          const tokenFieldsChanged = 
            newRecord.monthly_tokens !== oldRecord.monthly_tokens ||
            newRecord.extra_tokens !== oldRecord.extra_tokens ||
            newRecord.total_tokens_used !== oldRecord.total_tokens_used;

          if (tokenFieldsChanged) {
            clearTokenCache();
            debouncedFetch(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, debouncedFetch, clearTokenCache]);

  // Auto-refresh reduzido
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      if (!document.hidden) {
        debouncedFetch(true);
      }
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [debouncedFetch, user?.id]);

  // Carregamento inicial
  useEffect(() => {
    if (user?.id && !tokens) {
      fetchTokens();
    }
  }, [user?.id, fetchTokens, tokens]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    tokens,
    loading,
    error,
    isRefreshing,
    showUpgradeModal,
    setShowUpgradeModal,
    lastUpdate,
    refreshTokens: () => {
      clearTokenCache();
      fetchTokens(true);
    },
    // Utility functions
    getUsagePercentage: useCallback(() => {
      if (!tokens) return 0;
      const totalTokens = tokens.monthly_tokens + tokens.extra_tokens;
      if (totalTokens === 0) return 100;
      return Math.round(((totalTokens - tokens.total_available) / totalTokens) * 100);
    }, [tokens]),
    getStatusColor: useCallback(() => {
      if (!tokens) return 'text-gray-500';
      const available = tokens.total_available;
      const total = tokens.monthly_tokens + tokens.extra_tokens;
      const percentage = (available / total) * 100;
      
      if (percentage > 50) return 'text-green-500';
      if (percentage > 20) return 'text-yellow-500';
      return 'text-red-500';
    }, [tokens]),
    shouldShowLowTokenWarning: useCallback(() => {
      if (!tokens) return false;
      const available = tokens.total_available;
      const total = tokens.monthly_tokens + tokens.extra_tokens;
      return (available / total) < 0.2;
    }, [tokens]),
  };
};
