import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TokenData {
  monthly_tokens: number;
  extra_tokens: number;
  total_available: number;
  total_tokens_used: number;
}

const CACHE_KEY = 'tokens_cache';
const CACHE_DURATION = 60000; // Increased to 60 seconds for less aggressive refreshing

// Global state to prevent multiple subscriptions
let globalChannel: any = null;
let globalUserId: string | null = null;
let subscriptionCount = 0;

export const useTokens = () => {
  const { user } = useAuth();
  const [tokens, setTokens] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showExhaustedModal, setShowExhaustedModal] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [processingMessage, setProcessingMessage] = useState<string>('');
  
  // Local ref to track if this instance should manage cleanup
  const isManagerRef = useRef(false);
  // Ref to prevent excessive refreshing
  const lastRefreshRef = useRef<number>(0);

  // Cache functions
  const getCachedTokens = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
      }
    } catch (error) {
      console.warn('Cache read error:', error);
    }
    return null;
  }, []);

  const setCachedTokens = useCallback((data: TokenData) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      console.log('✅ Cache salvo com sucesso:', {
        totalAvailable: data.total_available,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  }, []);

  const fetchTokens = useCallback(async () => {
    if (!user) return null;

    try {
      console.log('🔄 Iniciando busca de tokens para usuário:', user.id);
      console.log('🔒 Tentando usar função RPC check_token_balance corrigida...');
      
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('check_token_balance', { p_user_id: user.id });

      if (rpcError) {
        console.warn('⚠️ RPC check_token_balance falhou:', rpcError);
        throw rpcError;
      }

      if (!rpcData || rpcData.length === 0) {
        throw new Error('RPC não retornou dados');
      }

      const tokenData = rpcData[0];
      console.log('✅ RPC check_token_balance (CORRIGIDA) funcionou:', {
        monthly_tokens: tokenData.monthly_tokens,
        extra_tokens: tokenData.extra_tokens,
        total_available: tokenData.total_available,
        total_used: tokenData.total_used
      });

      const result: TokenData = {
        monthly_tokens: tokenData.monthly_tokens,
        extra_tokens: tokenData.extra_tokens,
        total_available: tokenData.total_available,
        total_tokens_used: tokenData.total_used
      };

      console.log('📊 Tokens atualizados (VALORES CORRETOS):', {
        totalAvailable: result.total_available,
        monthlyTokens: result.monthly_tokens,
        extraTokens: result.extra_tokens,
        totalUsed: result.total_tokens_used,
        calculation: `${result.monthly_tokens} + ${result.extra_tokens} - ${result.total_tokens_used} = ${result.total_available}`,
        method: 'RPC_CORRIGIDA',
        timestamp: new Date().toLocaleTimeString()
      });

      setCachedTokens(result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar tokens:', error);
      throw error;
    }
  }, [user, setCachedTokens]);

  const refreshTokens = useCallback(async (force = false) => {
    if (!user || (isRefreshing && !force)) return;

    // Prevent excessive refreshing - minimum 5 seconds between refreshes
    const now = Date.now();
    if (!force && now - lastRefreshRef.current < 5000) {
      console.log('⏳ Refresh bloqueado - muito frequente');
      return;
    }

    setIsRefreshing(true);
    setError(null);
    lastRefreshRef.current = now;

    try {
      const data = await fetchTokens();
      if (data) {
        setTokens(data);
        setLastUpdate(new Date());
        
        // Se estava processando e agora temos tokens, marcar como sucesso
        if (processingStatus === 'processing') {
          setProcessingStatus('success');
          setProcessingMessage('Tokens atualizados com sucesso!');
          
          // Limpar status após 5 segundos
          setTimeout(() => {
            setProcessingStatus('idle');
            setProcessingMessage('');
          }, 5000);
        }
      }
    } catch (err) {
      console.error('Erro ao atualizar tokens:', err);
      setError('Erro ao carregar tokens');
      
      if (processingStatus === 'processing') {
        setProcessingStatus('error');
        setProcessingMessage('Erro ao atualizar tokens. Tente novamente.');
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [user, isRefreshing, fetchTokens, processingStatus]);

  // Função para indicar que uma compra está sendo processada
  const setTokenProcessing = useCallback((message?: string) => {
    setProcessingStatus('processing');
    setProcessingMessage(message || 'Processando compra de tokens...');
  }, []);

  // Função para limpar status de processamento
  const clearProcessingStatus = useCallback(() => {
    setProcessingStatus('idle');
    setProcessingMessage('');
  }, []);

  // Check if user can afford a feature
  const canAffordFeature = useCallback((feature: string) => {
    if (!tokens) return false;
    
    const requiredTokens = {
      chat: 100,
      copy: 500,
      analysis: 300
    };
    
    const required = requiredTokens[feature as keyof typeof requiredTokens] || 100;
    return tokens.total_available >= required;
  }, [tokens]);

  // Handle upgrade modal
  const handleUpgrade = useCallback(() => {
    setShowUpgradeModal(true);
    setShowExhaustedModal(false);
  }, []);

  // Handle close exhausted modal
  const handleCloseExhaustedModal = useCallback(() => {
    setShowExhaustedModal(false);
  }, []);

  // Check for low tokens and show modals
  useEffect(() => {
    if (tokens && user) {
      if (tokens.total_available === 0) {
        setShowExhaustedModal(true);
      } else if (tokens.total_available < 1000) {
        // Show upgrade modal for low tokens but not exhausted
        setTimeout(() => setShowUpgradeModal(true), 2000);
      }
    }
  }, [tokens, user]);

  // Initial load with cache
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    console.log('🔄 INICIANDO carregamento de tokens para usuário:', user.id);
    
    // Try cache first
    const cachedData = getCachedTokens();
    if (cachedData) {
      console.log('💾 Cache encontrado - carregamento instantâneo');
      setTokens(cachedData);
      setLoading(false);
      setLastUpdate(new Date());
      
      // Update in background only if cache is getting stale (30+ seconds)
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp > 30000) {
          console.log('🔄 Cache antigo - atualizando em segundo plano...');
          refreshTokens();
        }
      }
    } else {
      // No cache, load fresh data
      refreshTokens().finally(() => setLoading(false));
    }
  }, [user?.id, getCachedTokens, refreshTokens]);

  // Setup real-time subscription with global state management
  useEffect(() => {
    if (!user) return;

    subscriptionCount++;
    const instanceId = subscriptionCount;
    
    console.log(`🔄 Hook instance ${instanceId} for user:`, user.id);

    // Check if we need to create a new global subscription
    if (!globalChannel || globalUserId !== user.id) {
      console.log(`🔄 Configurando subscription GLOBAL de tokens (instance ${instanceId})`);
      
      // Cleanup existing subscription if user changed
      if (globalChannel && globalUserId !== user.id) {
        console.log('🧹 Limpando subscription anterior (usuário diferente)');
        supabase.removeChannel(globalChannel);
        globalChannel = null;
      }

      if (!globalChannel) {
        isManagerRef.current = true;
        globalUserId = user.id;
        
        const channelName = `tokens_global_${user.id}`;
        
        globalChannel = supabase
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
              console.log('🔄 Profile token update received:', {
                userId: payload.new?.id?.slice(0, 8),
                oldTokens: payload.old?.total_tokens_used,
                newTokens: payload.new?.total_tokens_used
              });
              
              // Only refresh if there's a significant change
              if (payload.old?.total_tokens_used !== payload.new?.total_tokens_used) {
                refreshTokens();
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'token_usage',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              console.log('🔄 Token usage update received:', payload);
              refreshTokens();
            }
          )
          .subscribe((status) => {
            console.log(`📡 Status da subscription GLOBAL de tokens (${channelName}):`, status);
          });
      }
    } else {
      console.log(`📡 Reutilizando subscription GLOBAL existente (instance ${instanceId})`);
    }

    return () => {
      console.log(`🧹 Cleanup hook instance ${instanceId}`);
      subscriptionCount--;
      
      // Only cleanup global subscription if this was the managing instance and no other instances exist
      if (isManagerRef.current && subscriptionCount === 0) {
        console.log('🧹 Limpando subscription GLOBAL (última instância)');
        if (globalChannel) {
          supabase.removeChannel(globalChannel);
          globalChannel = null;
          globalUserId = null;
        }
        isManagerRef.current = false;
      }
    };
  }, [user?.id, refreshTokens]);

  return {
    tokens,
    loading,
    error,
    lastUpdate,
    isRefreshing,
    refreshTokens,
    canAffordFeature,
    showUpgradeModal,
    setShowUpgradeModal,
    showExhaustedModal,
    setShowExhaustedModal,
    handleUpgrade,
    handleCloseExhaustedModal,
    processingStatus,
    processingMessage,
    setTokenProcessing,
    clearProcessingStatus
  };
};
