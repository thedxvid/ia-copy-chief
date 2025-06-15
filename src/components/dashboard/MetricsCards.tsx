
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderOpen, Clock, FileText, CheckCircle } from 'lucide-react';

const metrics = [
  {
    title: 'Projetos Ativos',
    value: '12',
    change: '+12%',
    icon: FolderOpen,
    color: 'text-[#3B82F6]',
    bgColor: 'bg-[#3B82F6]/10'
  },
  {
    title: 'Tempo Economizado',
    value: '47h',
    change: '+12h',
    icon: Clock,
    color: 'text-[#10B981]',
    bgColor: 'bg-[#10B981]/10'
  },
  {
    title: 'Palavras Escritas',
    value: '18.4K',
    change: '+24%',
    icon: FileText,
    color: 'text-[#F59E0B]',
    bgColor: 'bg-[#F59E0B]/10'
  },
  {
    title: 'Copies Aprovadas',
    value: '24',
    change: '+6',
    icon: CheckCircle,
    color: 'text-[#8B5CF6]',
    bgColor: 'bg-[#8B5CF6]/10'
  }
];

export const MetricsCards = () => {
  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 w-full max-w-full">
      {metrics.map((metric, index) => (
        <Card key={index} className="bg-[#1E1E1E] border-[#4B5563]/20 hover:border-[#4B5563]/40 transition-all duration-300 hover:scale-105 min-w-0 w-full rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-4 sm:p-4 lg:p-4">
            <CardTitle className="text-base sm:text-base lg:text-sm font-semibold text-white leading-tight truncate pr-3">
              {metric.title}
            </CardTitle>
            <div className={`p-2.5 sm:p-3 lg:p-2 rounded-lg ${metric.bgColor} flex-shrink-0 ml-2`}>
              <metric.icon className={`h-6 w-6 sm:h-7 sm:w-7 lg:h-4 lg:w-4 ${metric.color}`} />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-4 lg:p-4 pt-1 space-y-2">
            <div className="text-2xl sm:text-2xl lg:text-xl xl:text-2xl font-bold text-white">
              {metric.value}
            </div>
            <p className="text-sm text-green-500 flex items-center truncate text-muted-foreground">
              {metric.change} vs. mês anterior
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
