
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionStatus } from '@/components/subscription/SubscriptionStatus';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { subscription, loading: subscriptionLoading, isSubscriptionActive } = useSubscription();
  const location = useLocation();

  // Lista de emails de administradores definitivos
  const adminEmails = ['davicastrowp@gmail.com', 'admin@iacopychief.com'];
  
  // Verificar se é admin
  const isAdmin = user?.email && adminEmails.includes(user.email);

  if (authLoading || subscriptionLoading) {
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
