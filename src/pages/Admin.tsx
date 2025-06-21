
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserActivator } from '@/components/admin/UserActivator';
import { UserTable } from '@/components/admin/UserTable';
import { QuizTemplatesManager } from '@/components/admin/QuizTemplatesManager';
import { SecurityAuditDashboard } from '@/components/admin/SecurityAuditDashboard';
import { Shield, Users, UserPlus, MessageSquare, Activity } from 'lucide-react';

const Admin = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center space-x-3 mb-6">
        <Shield className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
      </div>
      
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="activation" className="flex items-center space-x-2">
            <UserPlus className="h-4 w-4" />
            <span>Ativação</span>
          </TabsTrigger>
          <TabsTrigger value="quiz" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>Quiz Templates</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Segurança</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserTable />
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
  );
};

export default Admin;
