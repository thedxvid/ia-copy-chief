import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface TokenData {
  monthly_tokens: number;
  extra_tokens: number;
  total_available: number;
  total_tokens_used: number;
}

const CACHE_KEY = 'tokens_cache';
const CACHE_DURATION = 30000;
const SECURITY_TOKEN_LIMIT = 2000;

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
      console.log('✅ Cache de tokens atualizado:', {
        monthlyTokens: data.monthly_tokens,
        extraTokens: data.extra_tokens,
        totalAvailable: data.total_available,
        totalUsed: data.total_tokens_used,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  }, []);

  const fetchTokens = useCallback(async () => {
    if (!user) return null;

    try {
      console.log('🔄 BUSCANDO tokens para usuário:', user.id);
      console.log('🔒 Usando função RPC check_token_balance corrigida...');
      
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('check_token_balance', { p_user_id: user.id });

      if (rpcError) {
        console.error('❌ RPC check_token_balance erro:', rpcError);
        throw rpcError;
      }

      if (!rpcData || rpcData.length === 0) {
        console.warn('⚠️ RPC não retornou dados');
        throw new Error('RPC não retornou dados');
      }

      const tokenData = rpcData[0];
      console.log('✅ TOKENS ENCONTRADOS (Nova lógica):', {
        monthly_tokens: tokenData.monthly_tokens,
        extra_tokens: tokenData.extra_tokens,
        total_available: tokenData.total_available, // Agora é apenas extra_tokens
        total_used: tokenData.total_used
      });

      const result: TokenData = {
        monthly_tokens: tokenData.monthly_tokens,
        extra_tokens: tokenData.extra_tokens,
        total_available: tokenData.total_available, // CORREÇÃO: Agora apenas extra_tokens
        total_tokens_used: tokenData.total_used
      };

      console.log('🎯 NOVA LÓGICA DE TOKENS:', {
        'Limite Mensal (fixo)': tokenData.monthly_tokens,
        'Tokens Disponíveis (gastáveis)': tokenData.extra_tokens,
        'Total Usado': tokenData.total_used,
        'Segurança ativa': 'Bloqueio em 2.000 tokens'
      });

      setCachedTokens(result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar tokens:', error);
      throw error;
    }
  }, [user, setCachedTokens]);

  // Função refreshTokens
  const refreshTokens = useCallback(async (force = false) => {
    if (!user) return;

    const now = Date.now();
    if (!force && now - lastRefreshRef.current < 5000) {
      console.log('🚫 Refresh bloqueado - muito recente');
      return;
    }

    lastRefreshRef.current = now;
    setIsRefreshing(true);
    setError(null);

    try {
      console.log('🔄 Atualizando tokens...');
      const freshTokens = await fetchTokens();
      if (freshTokens) {
        setTokens(freshTokens);
        setLastUpdate(new Date());
        console.log('✅ Tokens atualizados:', freshTokens);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ Erro ao atualizar tokens:', err);
      setError(errorMessage);
    } finally {
      setIsRefreshing(false);
    }
  }, [user, fetchTokens]);

  // FUNÇÃO CORRIGIDA: Verificar se usuário pode usar funcionalidades que consomem tokens
  const requireTokens = useCallback((minTokens: number = 100, feature: string = 'funcionalidade') => {
    if (!tokens) {
      console.warn(`🚫 [Token Guard] Tokens não carregados para ${feature}`);
      toast.error('Erro', {
        description: 'Carregando informações de tokens. Tente novamente em um momento.'
      });
      return false;
    }
    
    // CORREÇÃO CRÍTICA: Verificar apenas tokens disponíveis (extra_tokens)
    if (tokens.total_available <= 0) {
      console.warn(`🚫 [Token Guard] BLOQUEADO - Sem tokens para ${feature}:`, {
        available: tokens.total_available,
        required: minTokens
      });
      
      toast.error('Tokens esgotados', {
        description: 'Você não possui tokens disponíveis. Compre tokens extras para continuar usando esta funcionalidade.'
      });
      
      setShowUpgradeModal(true);
      return false;
    }
    
    // NOVO: Bloqueio de segurança - requisições acima de 2.000 tokens são bloqueadas
    if (minTokens > SECURITY_TOKEN_LIMIT) {
      console.warn(`🚫 [Token Guard] BLOQUEADO - Requisição muito grande para ${feature}:`, {
        requested: minTokens,
        securityLimit: SECURITY_TOKEN_LIMIT
      });
      
      toast.error('Requisição muito grande', {
        description: `Esta operação requer ${minTokens} tokens, mas o limite de segurança é ${SECURITY_TOKEN_LIMIT} tokens por requisição.`
      });
      
      return false;
    }
    
    // NOVO: Verificar se há tokens suficientes considerando o limite de segurança
    if (tokens.total_available < Math.max(minTokens, SECURITY_TOKEN_LIMIT)) {
      console.warn(`🚫 [Token Guard] BLOQUEADO - Tokens insuficientes para ${feature}:`, {
        available: tokens.total_available,
        required: minTokens,
        securityBuffer: SECURITY_TOKEN_LIMIT,
        message: `Para segurança, mantenha pelo menos ${SECURITY_TOKEN_LIMIT} tokens disponíveis`
      });
      
      toast.warning('Tokens insuficientes', {
        description: `Para garantir o funcionamento correto, mantenha pelo menos ${SECURITY_TOKEN_LIMIT} tokens disponíveis. Compre mais tokens para continuar.`
      });
      
      setShowUpgradeModal(true);
      return false;
    }
    
    console.log(`✅ [Token Guard] Aprovado para ${feature}:`, {
      available: tokens.total_available,
      required: minTokens,
      securityOk: `Buffer de ${SECURITY_TOKEN_LIMIT} tokens mantido`
    });
    
    return true;
  }, [tokens, setShowUpgradeModal]);

  // FUNÇÃO CORRIGIDA: Verificar se tokens estão zerados ou abaixo do limite de segurança
  const isOutOfTokens = useCallback(() => {
    return !tokens || tokens.total_available < SECURITY_TOKEN_LIMIT;
  }, [tokens]);

  // Função para indicar que uma compra está sendo processada
  const setTokenProcessing = useCallback((message?: string) => {
    console.log('🔄 COMPRA EM PROCESSAMENTO:', message);
    setProcessingStatus('processing');
    setProcessingMessage(message || 'Processando compra de tokens...');
    
    // Forçar refresh após 2 segundos
    setTimeout(() => {
      console.log('🔄 Auto-refresh após compra...');
      refreshTokens(true);
    }, 2000);
  }, [refreshTokens]);

  // Função para limpar status de processamento
  const clearProcessingStatus = useCallback(() => {
    setProcessingStatus('idle');
    setProcessingMessage('');
  }, []);

  // FUNÇÃO CORRIGIDA: Check if user can afford a feature
  const canAffordFeature = useCallback((feature: string) => {
    if (!tokens) return false;
    
    const requiredTokens = {
      chat: 100,
      copy: 500,
      analysis: 300,
      quiz: 200,
      tools: 150
    };
    
    const required = requiredTokens[feature as keyof typeof requiredTokens] || 100;
    
    // CORREÇÃO: Verificar apenas tokens disponíveis + buffer de segurança
    return tokens.total_available >= (required + SECURITY_TOKEN_LIMIT);
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

  // CORREÇÃO: Check for low tokens and show modals (nova lógica)
  useEffect(() => {
    if (tokens && user) {
      if (tokens.total_available <= 0) {
        console.log('🚨 Usuário sem tokens disponíveis:', {
          available: tokens.total_available,
          monthlyLimit: tokens.monthly_tokens
        });
        setShowExhaustedModal(true);
      } else if (tokens.total_available < SECURITY_TOKEN_LIMIT) {
        console.log('⚠️ Usuário com poucos tokens (abaixo do limite de segurança):', {
          available: tokens.total_available,
          securityLimit: SECURITY_TOKEN_LIMIT
        });
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
      
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp > 15000) {
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
                oldExtraTokens: payload.old?.extra_tokens,
                newExtraTokens: payload.new?.extra_tokens,
                oldMonthlyTokens: payload.old?.monthly_tokens,
                newMonthlyTokens: payload.new?.monthly_tokens
              });
              
              // Refresh se houve mudança nos tokens
              if (payload.old?.extra_tokens !== payload.new?.extra_tokens ||
                  payload.old?.monthly_tokens !== payload.new?.monthly_tokens ||
                  payload.old?.total_tokens_used !== payload.new?.total_tokens_used) {
                console.log('🔄 Tokens alterados - fazendo refresh...');
                refreshTokens(true);
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
              refreshTokens(true);
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'token_package_purchases',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              console.log('🔄 Token purchase update received:', payload);
              if (payload.eventType === 'UPDATE' && payload.new?.payment_status === 'completed') {
                console.log('🎯 COMPRA DE TOKENS COMPLETADA - forçando refresh...');
                setTimeout(() => refreshTokens(true), 1000);
              }
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
    clearProcessingStatus,
    // FUNÇÕES ATUALIZADAS COM NOVA LÓGICA
    requireTokens,
    isOutOfTokens
  };
};
