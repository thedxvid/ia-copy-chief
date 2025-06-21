
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserActivator } from '@/components/admin/UserActivator';
import { UserTable } from '@/components/admin/UserTable';
import { QuizTemplatesManager } from '@/components/admin/QuizTemplatesManager';
import { SecurityAuditDashboard } from '@/components/admin/SecurityAuditDashboard';
import { TokenMonitoringDashboard } from '@/components/tokens/TokenMonitoringDashboard';
import { Shield, Users, UserPlus, MessageSquare, Activity, BarChart3 } from 'lucide-react';

const Admin = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-white">Painel Administrativo</h1>
        </div>
        
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5 bg-[#2A2A2A] border-[#4B5563]">
            <TabsTrigger value="users" className="flex items-center space-x-2 text-white data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white">
              <Users className="h-4 w-4" />
              <span>Usuários</span>
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center space-x-2 text-white data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4" />
              <span>Monitoramento</span>
            </TabsTrigger>
            <TabsTrigger value="activation" className="flex items-center space-x-2 text-white data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white">
              <UserPlus className="h-4 w-4" />
              <span>Ativação</span>
            </TabsTrigger>
            <TabsTrigger value="quiz" className="flex items-center space-x-2 text-white data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white">
              <MessageSquare className="h-4 w-4" />
              <span>Quiz Templates</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2 text-white data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white">
              <Activity className="h-4 w-4" />
              <span>Segurança</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserTable />
          </TabsContent>

          <TabsContent value="monitoring">
            <TokenMonitoringDashboard />
          </TabsContent>

          <TabsContent value="activation">
            <UserActivator />
          </TabsContent>

          <TabsContent value="quiz">
            <QuizTemplatesManager />
          </TabsContent>

          <TabsContent value="security">
            <SecurityAuditDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Admin;
