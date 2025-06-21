
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TokenMonitoringDashboard } from '@/components/tokens/TokenMonitoringDashboard';
import { UserActivator } from '@/components/admin/UserActivator';
import { AdminUserTable } from '@/components/admin/AdminUserTable';
import { QuizTemplatesManager } from '@/components/admin/QuizTemplatesManager';
import { UserTokenManagement } from '@/components/admin/UserTokenManagement';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Users, HelpCircle, BarChart3, UserCheck, Coins } from 'lucide-react';

const Admin = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<'overview' | 'tokens' | 'users' | 'user-table' | 'quiz' | 'token-management'>('overview');

  // Lista de emails de administradores definitivos
  const adminEmails = ['davicastrowp@gmail.com', 'admin@iacopychief.com'];
  
  // Verificar se é admin
  const isAdmin = user?.email && adminEmails.includes(user.email);

  // Se não é admin, redirecionar para dashboard
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const adminSections = [
    {
      id: 'overview' as const,
      title: 'Visão Geral',
      description: 'Dashboard principal administrativo',
      icon: BarChart3
    },
    {
      id: 'tokens' as const,
      title: 'Monitoramento de Tokens', 
      description: 'Acompanhe o uso de tokens dos usuários',
      icon: Settings
    },
    {
      id: 'token-management' as const,
      title: 'Gerenciar Tokens',
      description: 'Edite tokens de usuários manualmente',
      icon: Coins
    },
    {
      id: 'user-table' as const,
      title: 'Tabela de Usuários',
      description: 'Visualize todos os usuários e seus dados',
      icon: UserCheck
    },
    {
      id: 'users' as const,
      title: 'Gerenciar Usuários',
      description: 'Ativar e gerenciar contas de usuários',
      icon: Users
    },
    {
      id: 'quiz' as const,
      title: 'Editor de Quiz',
      description: 'Editar perguntas e templates dos quiz',
      icon: HelpCircle
    }
  ];

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'tokens':
        return <TokenMonitoringDashboard />;
      case 'token-management':
        return <UserTokenManagement />;
      case 'user-table':
        return <AdminUserTable />;
      case 'users':
        return <UserActivator />;
      case 'quiz':
        return <QuizTemplatesManager />;
      default:
        return (
          <div className="space-y-6">
            <Card className="bg-[#1E1E1E] border border-[#4B5563] rounded-lg">
              <CardHeader>
                <CardTitle className="text-white text-xl">🔧 Painel Administrativo</CardTitle>
                <CardDescription>
                  Bem-vindo, {user.email}! Você tem acesso às funções administrativas da plataforma.
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {adminSections.slice(1).map((section) => {
                const Icon = section.icon;
                return (
                  <Card 
                    key={section.id} 
                    className="bg-[#1E1E1E] border border-[#4B5563]/20 hover:border-[#3B82F6]/30 transition-colors cursor-pointer"
                    onClick={() => setActiveSection(section.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#3B82F6]/10 rounded-lg">
                          <Icon className="w-5 h-5 text-[#3B82F6]" />
                        </div>
                        <div>
                          <CardTitle className="text-white text-lg">{section.title}</CardTitle>
                          <CardDescription>{section.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        );
    }
  };

  return (
    <D Layout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in w-full max-w-full overflow-x-hidden">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 bg-[#1E1E1E] border border-[#4B5563] rounded-lg p-2">
          {adminSections.map((section) => {
            const Icon = section.icon;
            return (
              <Button
                key={section.id}
                variant={activeSection === section.id ? "default" : "ghost"}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 ${
                  activeSection === section.id 
                    ? 'bg-[#3B82F6] text-white' 
                    : 'text-[#CCCCCC] hover:text-white hover:bg-[#2A2A2A]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{section.title}</span>
              </Button>
            );
          })}
        </div>

        {/* Active Section Content */}
        <div className="w-full max-w-full space-y-4 sm:space-y-6">
          {renderActiveSection()}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Admin;
