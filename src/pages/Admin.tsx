
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminUserTable } from '@/components/admin/AdminUserTable';
import { UserTokenManagement } from '@/components/admin/UserTokenManagement';
import { UserAdder } from '@/components/admin/UserAdder';
import { TokenMonitoringDashboard } from '@/components/admin/TokenMonitoringDashboard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';

const Admin = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
            <p className="text-muted-foreground">Você precisa estar logado para acessar esta página.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground">Gerencie usuários, tokens e monitore o sistema</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="tokens">Gerenciar Tokens</TabsTrigger>
            <TabsTrigger value="adduser">Adicionar Usuário</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <AdminUserTable />
          </TabsContent>

          <TabsContent value="tokens" className="space-y-4">
            <UserTokenManagement />
          </TabsContent>

          <TabsContent value="adduser" className="space-y-4">
            <UserAdder />
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-4">
            <TokenMonitoringDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Admin;
