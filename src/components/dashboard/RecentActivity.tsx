
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Bot, FileText, TrendingUp } from 'lucide-react';

const activities = [
  {
    text: 'Projeto "Landing Page Curso" publicado',
    detail: 'CTR: 4.2%',
    time: '2 horas atrás',
    icon: CheckCircle,
    color: 'text-green-500'
  },
  {
    text: 'Agente Headlines gerou 15 variações',
    detail: 'para campanha Black Friday',
    time: '4 horas atrás',
    icon: Bot,
    color: 'text-[#3B82F6]'
  },
  {
    text: 'Template "Email Urgência" usado',
    detail: '3 vezes esta semana',
    time: '1 dia atrás',
    icon: FileText,
    color: 'text-[#F59E0B]'
  },
  {
    text: 'Meta de conversão atingida',
    detail: '3.4% vs meta de 3%',
    time: '2 dias atrás',
    icon: TrendingUp,
    color: 'text-green-500'
  }
];

export const RecentActivity = () => {
  return (
    <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
      <CardHeader>
        <CardTitle className="text-white">Atividade Recente</CardTitle>
        <CardDescription className="text-[#CCCCCC]">
          Últimas atividades dos últimos 7 dias
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                <activity.icon className={`w-5 h-5 ${activity.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">
                  {activity.text}
                </p>
                <p className="text-sm text-[#CCCCCC]">
                  {activity.detail}
                </p>
                <p className="text-xs text-[#888888] mt-1">
                  {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
