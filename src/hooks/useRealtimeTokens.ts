
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTokens } from './useTokens';

export const useRealtimeTokens = () => {
  const { user } = useAuth();
  const { refreshTokens, tokens } = useTokens();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [retryCount, setRetryCount] = useState(0);

  const handleTokenUpdate = useCallback((payload: any) => {
    console.log('🔄 Realtime update received:', payload);
    const data = payload.new || payload.old;
    
    // Só atualizar se for do usuário atual
    if (data && user && data.user_id === user.id) {
      console.log('✅ Token update for current user:', payload);
      setLastUpdate(new Date());
      
      // Debounce para evitar muitas atualizações
      setTimeout(() => {
        refreshTokens();
      }, 300);
    }
  }, [user, refreshTokens]);

  const setupRealtimeConnection = useCallback(() => {
    if (!user?.id) {
      setConnectionStatus('disconnected');
      setIsConnected(false);
      return;
    }

    console.log('🔌 Setting up realtime connection for user:', user.id);
    setConnectionStatus('connecting');

    // Canal principal para mudanças de tokens
    const tokenChannel = supabase
      .channel(`user_tokens_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'token_usage',
          filter: `user_id=eq.${user.id}`
        },
        handleTokenUpdate
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        handleTokenUpdate
      )
      .subscribe((status) => {
        console.log('📡 Realtime channel status:', status);
        
        switch (status) {
          case 'SUBSCRIBED':
            setIsConnected(true);
            setConnectionStatus('connected');
            setRetryCount(0);
            console.log('✅ Realtime connected successfully');
            break;
          case 'CHANNEL_ERROR':
            setIsConnected(false);
            setConnectionStatus('error');
            console.error('❌ Realtime channel error');
            break;
          case 'TIMED_OUT':
            setIsConnected(false);
            setConnectionStatus('error');
            console.warn('⏰ Realtime connection timed out');
            break;
          case 'CLOSED':
            setIsConnected(false);
            setConnectionStatus('disconnected');
            console.warn('🔌 Realtime channel closed');
            break;
        }
      });

    return tokenChannel;
  }, [user?.id, handleTokenUpdate]);

  const forceReconnect = useCallback(() => {
    console.log('🔄 Force reconnecting...');
    setRetryCount(0);
    setConnectionStatus('connecting');
    
    // Pequeno delay antes de tentar reconectar
    setTimeout(() => {
      setupRealtimeConnection();
    }, 500);
  }, [setupRealtimeConnection]);

  // Retry automático em caso de erro
  useEffect(() => {
    if (connectionStatus === 'error' && retryCount < 3) {
      const timeout = setTimeout(() => {
        console.log(`🔄 Auto retry attempt ${retryCount + 1}/3`);
        setRetryCount(prev => prev + 1);
        setupRealtimeConnection();
      }, Math.pow(2, retryCount) * 1000); // Backoff exponencial

      return () => clearTimeout(timeout);
    }
  }, [connectionStatus, retryCount, setupRealtimeConnection]);

  useEffect(() => {
    let channel: any = null;

    if (user?.id) {
      channel = setupRealtimeConnection();
    } else {
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }

    return () => {
      if (channel) {
        console.log('🔌 Cleaning up realtime channel');
        supabase.removeChannel(channel);
      }
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };
  }, [user?.id, setupRealtimeConnection]);

  // Heartbeat simplificado
  useEffect(() => {
    if (!isConnected || !user?.id) return;

    const heartbeat = setInterval(() => {
      console.log('💓 Heartbeat check');
      // Se estiver conectado, manter o status
      if (connectionStatus === 'connected') {
        console.log('💓 Connection healthy');
      }
    }, 30000); // Check a cada 30 segundos

    return () => clearInterval(heartbeat);
  }, [isConnected, connectionStatus, user?.id]);

  return {
    isConnected,
    connectionStatus,
    lastUpdate,
    tokens,
    forceReconnect,
    retryCount
  };
};
