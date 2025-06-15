
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SubscriptionStatus } from '@/components/subscription/SubscriptionStatus';

const Checkout = () => {
  const { user, loading } = useAuth();

  // Lista de emails de administradores definitivos
  const adminEmails = ['davicastrowp@gmail.com', 'admin@iacopychief.com'];
  
  // Verificar se é admin
  const isAdmin = user?.email && adminEmails.includes(user.email);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6]"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Se é admin, redirecionar direto para dashboard
  if (isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <SubscriptionStatus />;
};

export default Checkout;
