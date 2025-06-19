
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

  const handleTokenUpdate = useCallback((payload: any) => {
    const data = payload.new || payload.old;
    
    // Só atualizar se for do usuário atual
    if (data && user && data.user_id === user.id) {
      console.log('🔄 Token update received:', payload);
      setLastUpdate(new Date());
      
      // Debounce para evitar muitas atualizações
      setTimeout(() => {
        refreshTokens();
      }, 500);
    }
  }, [user, refreshTokens]);

  useEffect(() => {
    if (!user?.id) return;

    console.log('🔌 Configurando realtime tokens para usuário:', user.id);

    // Canal para mudanças na tabela token_usage
    const tokenUsageChannel = supabase
      .channel(`token_usage_${user.id}`)
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
      .subscribe((status) => {
        console.log('📡 Token usage channel status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Canal para mudanças na tabela profiles
    const profilesChannel = supabase
      .channel(`profiles_${user.id}`)
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
        console.log('📡 Profiles channel status:', status);
      });

    return () => {
      console.log('🔌 Desconectando canais realtime');
      supabase.removeChannel(tokenUsageChannel);
      supabase.removeChannel(profilesChannel);
      setIsConnected(false);
    };
  }, [user?.id, handleTokenUpdate]);

  return {
    isConnected,
    lastUpdate,
    tokens
  };
};
