
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Clock, FileText, CheckCircle } from 'lucide-react';

const metrics = [
  {
    title: 'Projetos Ativos',
    value: '12',
    change: '+2 esta semana',
    icon: TrendingUp,
    color: 'text-[#3B82F6]',
    bgColor: 'bg-[#3B82F6]/10'
  },
  {
    title: 'Tempo Economizado',
    value: '8.5h',
    change: 'vs manual',
    icon: Clock,
    color: 'text-[#10B981]',
    bgColor: 'bg-[#10B981]/10'
  },
  {
    title: 'Palavras Escritas',
    value: '45.2k',
    change: '+12% este mês',
    icon: FileText,
    color: 'text-[#F59E0B]',
    bgColor: 'bg-[#F59E0B]/10'
  },
  {
    title: 'Copies Aprovadas',
    value: '89%',
    change: 'taxa de sucesso',
    icon: CheckCircle,
    color: 'text-[#8B5CF6]',
    bgColor: 'bg-[#8B5CF6]/10'
  }
];

export const MetricsCards = () => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      {metrics.map((metric, index) => (
        <Card key={index} className="bg-[#1E1E1E] border-[#4B5563]/20 hover:border-[#4B5563]/40 transition-colors">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className={`p-2 sm:p-3 ${metric.bgColor} rounded-xl flex-shrink-0`}>
                <metric.icon className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${metric.color}`} />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">
                {metric.value}
              </p>
              <p className="text-xs sm:text-sm text-[#CCCCCC] truncate">
                {metric.title}
              </p>
              <p className="text-xs text-[#888888] mt-1 truncate">
                {metric.change}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
