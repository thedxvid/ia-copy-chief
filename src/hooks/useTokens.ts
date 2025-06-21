
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
const CACHE_DURATION = 30000; // 30 segundos

export const useTokens = () => {
  const { user } = useAuth();
  const [tokens, setTokens] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use refs to track subscriptions and prevent duplicates
  const channelRef = useRef<any>(null);
  const subscriptionActiveRef = useRef(false);

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

    setIsRefreshing(true);
    setError(null);

    try {
      const data = await fetchTokens();
      if (data) {
        setTokens(data);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Erro ao atualizar tokens:', err);
      setError('Erro ao carregar tokens');
    } finally {
      setIsRefreshing(false);
    }
  }, [user, isRefreshing, fetchTokens]);

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
      
      // Update in background
      console.log('🔄 Atualizando dados em segundo plano...');
      refreshTokens();
    } else {
      // No cache, load fresh data
      refreshTokens().finally(() => setLoading(false));
    }
  }, [user?.id, getCachedTokens, refreshTokens]);

  // Setup real-time subscription - ONLY ONCE
  useEffect(() => {
    if (!user || subscriptionActiveRef.current) return;

    console.log('🔄 Configurando subscriptions ULTRA-ROBUSTAS de tokens para usuário:', user.id);

    // Cleanup any existing subscription
    if (channelRef.current) {
      console.log('🧹 Limpando subscription anterior');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const timestamp = Date.now();
    const channelName = `tokens_${user.id}_${timestamp}`;
    
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
          console.log('🔄 Profile token update received:', {
            userId: payload.new?.id?.slice(0, 8),
            oldTokens: payload.old?.total_tokens_used,
            newTokens: payload.new?.total_tokens_used
          });
          
          refreshTokens();
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
        console.log('📡 Status da subscription ULTRA-ROBUSTA de tokens:', status);
        if (status === 'SUBSCRIBED') {
          subscriptionActiveRef.current = true;
        }
      });

    channelRef.current = channel;

    return () => {
      console.log('🧹 Limpando subscription ULTRA-ROBUSTA de tokens');
      subscriptionActiveRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, refreshTokens]);

  return {
    tokens,
    loading,
    error,
    lastUpdate,
    isRefreshing,
    refreshTokens
  };
};
