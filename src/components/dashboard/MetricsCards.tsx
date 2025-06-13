
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderOpen, TrendingUp, FileText, DollarSign } from 'lucide-react';

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
    title: 'Taxa de Conversão',
    value: '3.4%',
    change: '+8%',
    icon: TrendingUp,
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
    title: 'ROI Médio',
    value: '287%',
    change: '+15%',
    icon: DollarSign,
    color: 'text-[#8B5CF6]',
    bgColor: 'bg-[#8B5CF6]/10'
  }
];

export const MetricsCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <Card key={index} className="bg-[#1E1E1E] border-[#4B5563]/20 hover:border-[#4B5563]/40 transition-all duration-300 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              {metric.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${metric.bgColor}`}>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-1">
              {metric.value}
            </div>
            <p className="text-xs text-green-500 flex items-center">
              {metric.change} vs. mês anterior
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
