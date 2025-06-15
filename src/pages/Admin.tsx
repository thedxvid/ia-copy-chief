
import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TokenMonitoringDashboard } from '@/components/tokens/TokenMonitoringDashboard';
import { UserActivator } from '@/components/admin/UserActivator';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const Admin = () => {
  const { user } = useAuth();
  
  // Lista de emails de admin
  const adminEmails = ['davicastrowp@gmail.com', 'admin@iacopychief.com'];
  
  // Verificar se é admin
  const isAdmin = user?.email && adminEmails.includes(user.email);

  // Se não é admin, redirecionar para dashboard
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in w-full max-w-full overflow-x-hidden">
        <div className="bg-[#1E1E1E] border border-[#4B5563] rounded-lg p-4 sm:p-6">
          <h1 className="text-white text-2xl font-bold mb-2">🔧 Painel Administrativo</h1>
          <p className="text-[#888888]">Bem-vindo, {user.email}! Você tem acesso às funções administrativas da plataforma.</p>
        </div>
        
        <div className="w-full max-w-full space-y-4 sm:space-y-6">
          <TokenMonitoringDashboard />
          <UserActivator />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Admin;
