
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
    <Card className="bg-gradient-to-r from-[#1E1E1E] to-[#2A2A2A] border-[#4B5563]/20 w-full max-w-full overflow-hidden">
      <CardContent className="p-3 sm:p-4 lg:p-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-1 sm:mb-2">
              Olá, {userName}! 👋
            </h1>
            <p className="text-[#CCCCCC] text-xs sm:text-sm lg:text-base capitalize">
              {currentTime}
            </p>
          </div>
          
          <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 w-full">
            <Button asChild size="sm" className="bg-[#3B82F6] hover:bg-[#2563EB] flex-1 xs:flex-none text-xs sm:text-sm min-w-0">
              <Link to="/quiz" className="w-full flex items-center justify-center">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="truncate">Novo Projeto</span>
              </Link>
            </Button>
            
            <Button variant="outline" asChild size="sm" className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A] flex-1 xs:flex-none text-xs sm:text-sm min-w-0">
              <Link to="/agents" className="w-full flex items-center justify-center">
                <Bot className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="truncate hidden xs:inline">Agente IA</span>
                <span className="truncate xs:hidden">IA</span>
              </Link>
            </Button>
            
            <Button variant="outline" size="sm" className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A] flex-1 xs:flex-none text-xs sm:text-sm min-w-0">
              <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="truncate">Templates</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
