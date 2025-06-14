import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Package, LayoutDashboard, Zap, Clock, Bot, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const QuickActions = () => {
  const actions = [
    {
      title: 'Novo Produto',
      description: 'Adicione um novo produto para gerar copies',
      icon: Package,
      href: '/products',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Dashboard',
      description: 'Visão geral dos seus produtos e copies',
      icon: LayoutDashboard,
      href: '/dashboard',
      color: 'from-green-500 to-teal-500'
    },
    {
      title: 'Gerar Copy',
      description: 'Crie copies incríveis com a IA',
      icon: Zap,
      href: '/tools',
      color: 'from-orange-500 to-yellow-500'
    },
    {
      title: 'Ver Analytics',
      description: 'Análise de performance das copies',
      icon: BarChart3,
      href: '/analytics',
      color: 'from-purple-500 to-pink-500'
    }
  ];

  return (
    <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
      <CardHeader>
        <CardTitle className="text-white">Ações Rápidas</CardTitle>
        <CardDescription className="text-[#CCCCCC]">
          Acesse rapidamente as principais funcionalidades
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => (
          <Link
            key={index}
            to={action.href}
            className="flex items-center space-x-3 p-3 rounded-lg bg-[#2A2A2A]/50 hover:bg-[#2A2A2A] transition-colors group"
          >
            <div className={`p-2 rounded-lg bg-gradient-to-r ${action.color} group-hover:scale-110 transition-transform`}>
              <action.icon className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-white group-hover:text-[#3B82F6] transition-colors">
                {action.title}
              </h4>
              <p className="text-xs text-[#888888]">{action.description}</p>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};
