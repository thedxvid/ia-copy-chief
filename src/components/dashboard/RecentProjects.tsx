
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
        <div className="space-y-4">
          {recentProjects.map((project, index) => (
            <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-[#2A2A2A]/50 hover:bg-[#2A2A2A] transition-colors">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-[#3B82F6]/10 rounded-lg">
                  <project.icon className="w-5 h-5 text-[#3B82F6]" />
                </div>
                <div>
                  <h4 className="font-medium text-white">{project.name}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm text-[#CCCCCC]">{project.type}</span>
                    <span className="text-[#4B5563]">•</span>
                    <span className="text-sm text-[#CCCCCC]">{project.date}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {project.performance && (
                  <span className="text-sm text-green-500 font-medium">
                    {project.performance}
                  </span>
                )}
                <Badge variant="secondary" className={`${project.statusColor} text-white`}>
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
