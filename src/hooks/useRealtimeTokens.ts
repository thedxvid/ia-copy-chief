
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTokens } from './useTokens';

interface TokenUpdate {
  user_id: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  timestamp: number;
}

export const useRealtimeTokens = () => {
  const { user } = useAuth();
  const { refreshTokens, tokens } = useTokens();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [retryCount, setRetryCount] = useState(0);
  const [heartbeatInterval, setHeartbeatInterval] = useState<NodeJS.Timeout | null>(null);

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
      }, 500);
    }
  }, [user, refreshTokens]);

  const setupRealtimeConnection = useCallback(() => {
    if (!user?.id) return;

    console.log('🔌 Configurando realtime tokens para usuário:', user.id);
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
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setConnectionStatus('connected');
          setRetryCount(0);
          console.log('✅ Realtime conectado com sucesso');
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          setConnectionStatus('error');
          console.error('❌ Erro no canal realtime');
        } else if (status === 'TIMED_OUT') {
          setIsConnected(false);
          setConnectionStatus('disconnected');
          console.warn('⏰ Timeout no canal realtime');
        } else if (status === 'CLOSED') {
          setIsConnected(false);
          setConnectionStatus('disconnected');
          console.warn('🔌 Canal realtime fechado');
        }
      });

    // Heartbeat para verificar conexão
    const heartbeat = setInterval(() => {
      if (tokenChannel.state === 'joined') {
        console.log('💓 Heartbeat - Conexão ativa');
        setIsConnected(true);
        setConnectionStatus('connected');
      } else {
        console.log('💔 Heartbeat - Conexão perdida');
        setIsConnected(false);
        setConnectionStatus('disconnected');
      }
    }, 10000); // Verificar a cada 10 segundos

    setHeartbeatInterval(heartbeat);

    return tokenChannel;
  }, [user?.id, handleTokenUpdate]);

  const retryConnection = useCallback(() => {
    if (retryCount >= 3) {
      console.log('🚫 Máximo de tentativas de reconexão atingido');
      setConnectionStatus('error');
      return;
    }

    console.log(`🔄 Tentando reconectar... (${retryCount + 1}/3)`);
    setRetryCount(prev => prev + 1);
    
    setTimeout(() => {
      setupRealtimeConnection();
    }, Math.pow(2, retryCount) * 1000); // Backoff exponencial
  }, [retryCount, setupRealtimeConnection]);

  useEffect(() => {
    if (!user?.id) {
      setIsConnected(false);
      setConnectionStatus('disconnected');
      return;
    }

    const channel = setupRealtimeConnection();

    // Auto-retry em caso de desconexão
    const retryTimeout = setTimeout(() => {
      if (!isConnected && connectionStatus === 'connecting') {
        retryConnection();
      }
    }, 5000);

    return () => {
      console.log('🔌 Desconectando canais realtime');
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      clearTimeout(retryTimeout);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };
  }, [user?.id, setupRealtimeConnection, isConnected, connectionStatus, retryConnection, heartbeatInterval]);

  const forceReconnect = useCallback(() => {
    console.log('🔄 Forçando reconexão manual...');
    setRetryCount(0);
    setupRealtimeConnection();
  }, [setupRealtimeConnection]);

  return {
    isConnected,
    connectionStatus,
    lastUpdate,
    tokens,
    forceReconnect,
    retryCount
  };
};
