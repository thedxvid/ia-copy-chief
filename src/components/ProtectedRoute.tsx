
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionStatus } from '@/components/subscription/SubscriptionStatus';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { subscription, loading: subscriptionLoading, isSubscriptionActive } = useSubscription();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);

  // Verificar se usuário é admin usando a função do banco
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.id) {
        setIsAdmin(false);
        setAdminCheckLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('is_user_admin', {
          user_id: user.id
        });

        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data || false);
        }
      } catch (err) {
        console.error('Error in admin check:', err);
        setIsAdmin(false);
      } finally {
        setAdminCheckLoading(false);
      }
    };

    if (user) {
      checkAdminStatus();
    } else {
      setAdminCheckLoading(false);
    }
  }, [user]);

  if (authLoading || subscriptionLoading || adminCheckLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6]"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Se é admin, permitir acesso direto sem verificar subscription
  if (isAdmin) {
    return <>{children}</>;
  }

  // Se o usuário tem status "pending" e não está na página de checkout, redirecionar
  if (subscription?.subscription_status === 'pending' && location.pathname !== '/checkout') {
    return <Navigate to="/checkout" replace />;
  }

  // Se não tem subscription ativa e não está na página de checkout, mostrar página de status
  if (!isSubscriptionActive && location.pathname !== '/checkout') {
    return <SubscriptionStatus />;
  }

  return <>{children}</>;
};
