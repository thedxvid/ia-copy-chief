
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
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
            <Button variant="outline" asChild size="sm" className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A] hover:shadow-sm transition-all duration-200 px-3 py-2 rounded-xl">
              <Link to="/chat" className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                <span>Agente IA</span>
              </Link>
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
            <Button variant="outline" asChild className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A] hover:shadow-sm transition-all duration-200 w-full rounded-xl text-base py-3">
              <Link to="/chat" className="flex items-center justify-center gap-2">
                <Bot className="w-5 h-5" />
                <span>Agente IA</span>
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
