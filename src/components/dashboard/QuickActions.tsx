
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Bot, BookOpen, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const quickActions = [
  {
    title: 'Templates Mais Usados',
    description: 'Acesso rápido aos seus favoritos',
    icon: FileText,
    color: 'bg-[#3B82F6]',
    link: '/tools'
  },
  {
    title: 'Agentes IA Ativos',
    description: 'Copy, Headlines, Scripts',
    icon: Bot,
    color: 'bg-[#10B981]',
    link: '/agents'
  },
  {
    title: 'Biblioteca de Headlines',
    description: 'Headlines que converteram',
    icon: BookOpen,
    color: 'bg-[#F59E0B]',
    link: '/tools'
  },
  {
    title: 'Análise Concorrência',
    description: 'Analise copies dos concorrentes',
    icon: Search,
    color: 'bg-[#8B5CF6]',
    link: '/tools'
  }
];

export const QuickActions = () => {
  return (
    <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
      <CardHeader>
        <CardTitle className="text-white">Atalhos Rápidos</CardTitle>
        <CardDescription className="text-[#CCCCCC]">
          Ferramentas mais utilizadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              asChild
              className="h-auto p-2 sm:p-4 text-left border-[#4B5563] hover:bg-[#2A2A2A] hover:border-[#3B82F6]/50 transition-all duration-200 min-w-0"
            >
              <Link to={action.link}>
                <div className="flex flex-col items-center space-y-2 sm:space-y-3 w-full min-w-0">
                  <div className={`p-1.5 sm:p-2 ${action.color} rounded-lg flex-shrink-0`}>
                    <action.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="text-center space-y-0.5 sm:space-y-1 w-full min-w-0">
                    <h4 className="font-medium text-white text-xs sm:text-sm leading-tight tracking-normal truncate w-full px-1">
                      {action.title}
                    </h4>
                    <p className="text-xs text-[#CCCCCC] leading-tight tracking-normal truncate w-full px-1">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
