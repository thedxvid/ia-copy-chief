
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionData {
  subscription_status: string;
  subscription_expires_at: string | null;
  payment_approved_at: string | null;
  checkout_url: string | null;
  kiwify_customer_id: string | null;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSubscription = async () => {
    if (!user) {
      setLoading(false);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_status, subscription_expires_at, payment_approved_at, checkout_url, kiwify_customer_id')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching subscription:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const initializeSubscription = async () => {
      const data = await fetchSubscription();
      setSubscription(data);
      setLoading(false);
    };

    initializeSubscription();

    // Criar polling automático para verificar mudanças de status
    const startPolling = () => {
      pollingIntervalRef.current = setInterval(async () => {
        const data = await fetchSubscription();
        if (data && subscription?.subscription_status !== data.subscription_status) {
          console.log('Subscription status changed:', data.subscription_status);
          setSubscription(data);
        }
      }, 5000); // Verificar a cada 5 segundos
    };

    // Só fazer polling se o status for 'pending'
    if (subscription?.subscription_status === 'pending') {
      startPolling();
    }

    // Create a unique channel name with timestamp to avoid conflicts
    const timestamp = Date.now();
    const channelName = `subscription_${user.id}_${timestamp}`;
    
    console.log('Creating subscription channel:', channelName);
    
    // Subscription real-time
    const subscriptionChannel = supabase
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
          console.log('Subscription update received:', payload);
          const newData = payload.new as SubscriptionData;
          setSubscription(newData);
          
          // Parar polling se status não for mais 'pending'
          if (newData.subscription_status !== 'pending' && pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription channel status:', status);
      });

    return () => {
      console.log('Cleaning up subscription channel:', channelName);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      supabase.removeChannel(subscriptionChannel);
    };
  }, [user?.id, subscription?.subscription_status]); // Incluir subscription_status para controlar polling

  const isSubscriptionActive = () => {
    if (!subscription) return false;
    
    if (subscription.subscription_status === 'active') {
      // Verificar se não expirou
      if (subscription.subscription_expires_at) {
        return new Date(subscription.subscription_expires_at) > new Date();
      }
      return true;
    }
    
    return false;
  };

  const isSubscriptionExpired = () => {
    if (!subscription) return false;
    
    if (subscription.subscription_status === 'active' && subscription.subscription_expires_at) {
      return new Date(subscription.subscription_expires_at) <= new Date();
    }
    
    return subscription.subscription_status === 'expired';
  };

  return {
    subscription,
    loading,
    isSubscriptionActive: isSubscriptionActive(),
    isSubscriptionExpired: isSubscriptionExpired(),
  };
};
