
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
    
    if (data && user && data.user_id === user.id) {
      console.log('✅ Token update for current user:', payload);
      setLastUpdate(new Date());
      
      // Atualizar tokens sem debounce
      refreshTokens();
    }
  }, [user, refreshTokens]);

  const setupRealtimeConnection = useCallback(() => {
    if (!user?.id) {
      console.log('❌ No user ID, disconnecting');
      setConnectionStatus('disconnected');
      setIsConnected(false);
      return null;
    }

    console.log('🔌 Setting up realtime connection for user:', user.id);
    setConnectionStatus('connecting');

    try {
      const channel = supabase
        .channel(`tokens_${user.id}_${Date.now()}`) // Unique channel name
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
        .subscribe((status, err) => {
          console.log('📡 Realtime subscription status:', status, err);
          
          if (err) {
            console.error('❌ Realtime subscription error:', err);
            setIsConnected(false);
            setConnectionStatus('error');
            return;
          }

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

      return channel;
    } catch (error) {
      console.error('❌ Error setting up realtime connection:', error);
      setIsConnected(false);
      setConnectionStatus('error');
      return null;
    }
  }, [user?.id, handleTokenUpdate]);

  const forceReconnect = useCallback(() => {
    console.log('🔄 Force reconnecting...');
    setRetryCount(0);
    setConnectionStatus('connecting');
    
    // Limpar conexão existente
    supabase.removeAllChannels();
    
    // Tentar reconectar
    setTimeout(() => {
      const channel = setupRealtimeConnection();
      if (!channel) {
        setConnectionStatus('error');
      }
    }, 1000);
  }, [setupRealtimeConnection]);

  // Auto retry com backoff exponencial
  useEffect(() => {
    if (connectionStatus === 'error' && retryCount < 5 && user?.id) {
      const timeout = setTimeout(() => {
        console.log(`🔄 Auto retry attempt ${retryCount + 1}/5`);
        setRetryCount(prev => prev + 1);
        
        // Limpar conexões antes de tentar novamente
        supabase.removeAllChannels();
        
        const channel = setupRealtimeConnection();
        if (!channel) {
          console.error('❌ Failed to setup channel on retry');
        }
      }, Math.min(Math.pow(2, retryCount) * 1000, 10000)); // Max 10 segundos

      return () => clearTimeout(timeout);
    }
  }, [connectionStatus, retryCount, setupRealtimeConnection, user?.id]);

  // Configurar conexão inicial
  useEffect(() => {
    let channel: any = null;

    if (user?.id) {
      console.log('🚀 Initializing realtime connection');
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
  }, [user?.id]); // Remover setupRealtimeConnection da dependência para evitar loops

  // Heartbeat para verificar conexão
  useEffect(() => {
    if (!user?.id || connectionStatus !== 'connected') return;

    const heartbeat = setInterval(() => {
      console.log('💓 Heartbeat - checking connection health');
      
      // Verificar se realmente está conectado
      const channels = supabase.getChannels();
      const activeChannels = channels.filter(ch => ch.state === 'joined');
      
      if (activeChannels.length === 0) {
        console.warn('💓 No active channels found, reconnecting...');
        setConnectionStatus('error');
      } else {
        console.log('💓 Connection healthy, active channels:', activeChannels.length);
      }
    }, 30000); // Check a cada 30 segundos

    return () => clearInterval(heartbeat);
  }, [user?.id, connectionStatus]);

  // Reset retry count quando usuário muda
  useEffect(() => {
    setRetryCount(0);
  }, [user?.id]);

  return {
    isConnected,
    connectionStatus,
    lastUpdate,
    tokens,
    forceReconnect,
    retryCount
  };
};
