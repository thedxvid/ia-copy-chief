
import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('subscription_status, subscription_expires_at, payment_approved_at, checkout_url, kiwify_customer_id')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching subscription:', error);
          return;
        }

        setSubscription(data);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();

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
          setSubscription(payload.new as SubscriptionData);
        }
      )
      .subscribe((status) => {
        console.log('Subscription channel status:', status);
      });

    return () => {
      console.log('Cleaning up subscription channel:', channelName);
      supabase.removeChannel(subscriptionChannel);
    };
  }, [user?.id]); // Only depend on user.id to prevent unnecessary re-renders

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
