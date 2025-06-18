
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TokenMonitoringDashboard } from '@/components/tokens/TokenMonitoringDashboard';
import { UserActivator } from '@/components/admin/UserActivator';
import { QuizTemplatesManager } from '@/components/admin/QuizTemplatesManager';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Users, HelpCircle, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Admin = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<'overview' | 'tokens' | 'users' | 'quiz'>('overview');
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

  // Mostrar loading enquanto verifica admin
  if (adminCheckLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6]"></div>
      </div>
    );
  }

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
    <DashboardLayout>
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
