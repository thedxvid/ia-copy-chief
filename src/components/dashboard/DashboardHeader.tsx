
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
      <CardContent className="p-4 sm:p-6">
        {/* Desktop Layout - Flexbox horizontal */}
        <div className="hidden lg:flex justify-between items-center">
          <div>
            <h1 className="text-2xl xl:text-3xl font-bold text-white mb-2">
              Olá, {userName}! 👋
            </h1>
            <p className="text-[#CCCCCC] text-base capitalize">
              {currentTime}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="bg-[#3B82F6] hover:bg-[#2563EB] hover:shadow-sm transition-all duration-200 px-3 py-2">
              <Link to="/quiz" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>Novo Projeto</span>
              </Link>
            </Button>
            
            <Button variant="outline" asChild size="sm" className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A] hover:shadow-sm transition-all duration-200 px-3 py-2">
              <Link to="/agents" className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                <span>Agente IA</span>
              </Link>
            </Button>
            
            <Button variant="outline" size="sm" className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A] hover:shadow-sm transition-all duration-200 px-3 py-2">
              <FileText className="w-4 h-4" />
              <span>Templates</span>
            </Button>
          </div>
        </div>

        {/* Mobile Layout - Stack vertical */}
        <div className="lg:hidden space-y-4">
          <div className="text-center">
            <h1 className="text-lg sm:text-xl font-bold text-white mb-2">
              Olá, {userName}! 👋
            </h1>
            <p className="text-[#CCCCCC] text-base capitalize">
              {currentTime}
            </p>
          </div>
          
          <div className="flex flex-col space-y-2">
            <Button asChild className="bg-[#3B82F6] hover:bg-[#2563EB] hover:shadow-sm transition-all duration-200 w-full rounded-lg text-base py-3">
              <Link to="/quiz" className="flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" />
                <span>Novo Projeto</span>
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A] hover:shadow-sm transition-all duration-200 w-full rounded-lg text-base py-3">
              <Link to="/agents" className="flex items-center justify-center gap-2">
                <Bot className="w-5 h-5" />
                <span>Agente IA</span>
              </Link>
            </Button>
            
            <Button variant="outline" className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A] hover:shadow-sm transition-all duration-200 w-full rounded-lg text-base py-3">
              <FileText className="w-5 h-5" />
              <span>Templates</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
