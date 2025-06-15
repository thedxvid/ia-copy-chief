
import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MetricsCards } from '@/components/dashboard/MetricsCards';
import { AnalyticsCharts } from '@/components/dashboard/AnalyticsCharts';
import { RecentProjects } from '@/components/dashboard/RecentProjects';
import { AIInsights } from '@/components/dashboard/AIInsights';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { GoalsProgress } from '@/components/dashboard/GoalsProgress';
import { TokenMonitoringDashboard } from '@/components/tokens/TokenMonitoringDashboard';
import { UserActivator } from '@/components/admin/UserActivator';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  
  // Lista de emails de admin
  const adminEmails = ['davicastrowp@gmail.com', 'admin@iacopychief.com'];
  
  // Verificar se é admin
  const isAdmin = user?.email && adminEmails.includes(user.email);

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in w-full max-w-full overflow-x-hidden">
        <DashboardHeader />
        
        {/* Painel administrativo de tokens e ativador de usuários (apenas para admins) */}
        {isAdmin && (
          <div className="w-full max-w-full space-y-4">
            <div className="bg-[#1E1E1E] border border-[#4B5563] rounded-lg p-4 mb-4">
              <h2 className="text-white text-lg font-semibold mb-2">🔧 Painel Administrativo</h2>
              <p className="text-[#888888] text-sm">Bem-vindo, {user.email}! Você tem acesso às funções administrativas.</p>
            </div>
            <TokenMonitoringDashboard />
            <UserActivator />
          </div>
        )}
        
        <MetricsCards />
        <div className="w-full max-w-full overflow-x-hidden">
          <AnalyticsCharts />
        </div>
        
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 w-full max-w-full">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 min-w-0">
            <RecentProjects />
            <RecentActivity />
          </div>
          <div className="space-y-4 sm:space-y-6 min-w-0">
            <AIInsights />
            <QuickActions />
            <GoalsProgress />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
