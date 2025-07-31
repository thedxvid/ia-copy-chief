
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
  const channelRef = useRef<any>(null);
  const subscriptionActiveRef = useRef(false);

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
  }, [user?.id]);

  // Setup polling and real-time subscription - ONLY ONCE
  useEffect(() => {
    if (!user || !subscription || subscriptionActiveRef.current) return;

    // Cleanup existing subscription
    if (channelRef.current) {
      console.log('Cleaning up previous subscription channel');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Clear existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // Setup polling only for pending status
    if (subscription.subscription_status === 'pending') {
      pollingIntervalRef.current = setInterval(async () => {
        const data = await fetchSubscription();
        if (data && subscription?.subscription_status !== data.subscription_status) {
          console.log('Subscription status changed via polling:', data.subscription_status);
          setSubscription(data);
          
          // Stop polling if no longer pending
          if (data.subscription_status !== 'pending' && pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      }, 5000);
    }

    // Create a unique channel name with timestamp to avoid conflicts
    const timestamp = Date.now();
    const channelName = `subscription_${user.id}_${timestamp}`;
    
    console.log('Creating subscription channel:', channelName);
    
    // Setup real-time subscription
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
          
          // Stop polling if status changed from pending
          if (newData.subscription_status !== 'pending' && pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription channel status:', status);
        if (status === 'SUBSCRIBED') {
          subscriptionActiveRef.current = true;
        }
      });

    channelRef.current = subscriptionChannel;

    return () => {
      console.log('Cleaning up subscription channel:', channelName);
      subscriptionActiveRef.current = false;
      
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, subscription?.subscription_status]);

  const isSubscriptionActive = () => {
    if (!subscription) return false;
    
    // Se o status é 'active', considerar como ativo independente da data de expiração
    // Isso resolve o problema de renovações que não atualizam a data de expiração
    if (subscription.subscription_status === 'active') {
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
