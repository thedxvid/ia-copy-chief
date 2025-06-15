
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, FileText, Mail, Megaphone } from 'lucide-react';
import { Link } from 'react-router-dom';

const recentProjects = [
  {
    name: 'Landing Page - Curso Online',
    type: 'Landing Page',
    status: 'Publicado',
    date: '2024-06-10',
    performance: '4.2% CTR',
    icon: FileText,
    statusColor: 'bg-green-500'
  },
  {
    name: 'Email Sequência - Black Friday',
    type: 'Email Marketing',
    status: 'Em revisão',
    date: '2024-06-09',
    performance: null,
    icon: Mail,
    statusColor: 'bg-yellow-500'
  },
  {
    name: 'Anúncio Facebook - Produto X',
    type: 'Anúncio',
    status: 'Rascunho',
    date: '2024-06-08',
    performance: null,
    icon: Megaphone,
    statusColor: 'bg-gray-500'
  },
  {
    name: 'Sales Page - Consultoria',
    type: 'Sales Page',
    status: 'Publicado',
    date: '2024-06-07',
    performance: '12.8% Conversão',
    icon: FileText,
    statusColor: 'bg-green-500'
  },
  {
    name: 'Email Newsletter Semanal',
    type: 'Email Marketing',
    status: 'Publicado',
    date: '2024-06-06',
    performance: '28.5% Abertura',
    icon: Mail,
    statusColor: 'bg-green-500'
  }
];

export const RecentProjects = () => {
  return (
    <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Projetos Recentes</CardTitle>
            <CardDescription className="text-[#CCCCCC]">
              Seus últimos 5 projetos criados
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A]">
            <Link to="/history">
              Ver todos
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 sm:space-y-3 lg:space-y-4">
          {recentProjects.map((project, index) => (
            <div key={index} className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-[#2A2A2A]/50 hover:bg-[#2A2A2A] transition-colors">
              <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                <div className="p-1.5 sm:p-2 bg-[#3B82F6]/10 rounded-lg flex-shrink-0">
                  <project.icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#3B82F6]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-white text-sm sm:text-base truncate">{project.name}</h4>
                  <div className="flex items-center space-x-1 sm:space-x-1.5 lg:space-x-2 mt-0.5 sm:mt-1">
                    <span className="text-xs sm:text-sm text-[#CCCCCC] truncate">{project.type}</span>
                    <span className="text-[#4B5563] text-xs">•</span>
                    <span className="text-xs sm:text-sm text-[#CCCCCC]">{project.date}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3 flex-shrink-0">
                {project.performance && (
                  <span className="text-xs sm:text-sm text-green-500 font-medium hidden sm:block">
                    {project.performance}
                  </span>
                )}
                <Badge variant="secondary" className={`${project.statusColor} text-white text-xs px-2 py-0.5`}>
                  {project.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
