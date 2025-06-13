
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
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Olá, {userName}! 👋
            </h1>
            <p className="text-[#CCCCCC] capitalize">
              {currentTime}
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button asChild className="bg-[#3B82F6] hover:bg-[#2563EB]">
              <Link to="/quiz">
                <Plus className="w-4 h-4 mr-2" />
                Novo Projeto
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A]">
              <Link to="/agents">
                <Bot className="w-4 h-4 mr-2" />
                Usar Agente IA
              </Link>
            </Button>
            
            <Button variant="outline" className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A]">
              <FileText className="w-4 h-4 mr-2" />
              Ver Templates
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
