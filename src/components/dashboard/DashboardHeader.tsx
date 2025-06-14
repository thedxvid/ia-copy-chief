
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Bot, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const DashboardHeader = () => {
  const { user } = useAuth();
  const currentTime = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const userName = user?.user_metadata?.full_name || 'Copywriter';

  return (
    <Card className="bg-gradient-to-r from-[#1E1E1E] to-[#2A2A2A] border-[#4B5563]/20">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">
              Olá, {userName}! 👋
            </h1>
            <p className="text-[#CCCCCC] text-sm sm:text-base capitalize">
              {currentTime}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button asChild size="sm" className="bg-[#3B82F6] hover:bg-[#2563EB] flex-1 sm:flex-none">
              <Link to="/quiz">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden xs:inline">Novo Projeto</span>
                <span className="xs:hidden">Novo</span>
              </Link>
            </Button>
            
            <Button variant="outline" asChild size="sm" className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A] flex-1 sm:flex-none">
              <Link to="/agents">
                <Bot className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Usar Agente IA</span>
                <span className="sm:hidden">Agente IA</span>
              </Link>
            </Button>
            
            <Button variant="outline" size="sm" className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A] flex-1 sm:flex-none">
              <FileText className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Ver Templates</span>
              <span className="sm:hidden">Templates</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
