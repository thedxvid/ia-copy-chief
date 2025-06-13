
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, TrendingUp, Clock, Target } from 'lucide-react';

const insights = [
  {
    text: 'Seus CTAs com urgência convertem 45% mais que CTAs neutros',
    icon: Target,
    type: 'conversion'
  },
  {
    text: 'Headlines com pergunta têm 32% melhor performance',
    icon: TrendingUp,
    type: 'performance'
  },
  {
    text: 'Emails enviados às 14h têm maior taxa de abertura',
    icon: Clock,
    type: 'timing'
  }
];

export const AIInsights = () => {
  return (
    <Card className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] border-[#4B5563]/20">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-[#3B82F6]/10 rounded-lg">
            <Lightbulb className="w-5 h-5 text-[#3B82F6]" />
          </div>
          <div>
            <CardTitle className="text-white">Insights da IA</CardTitle>
            <CardDescription className="text-[#CCCCCC]">
              Recomendações baseadas nos seus dados
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-[#1E1E1E]/50">
              <div className="p-1.5 bg-[#3B82F6]/10 rounded-md mt-0.5">
                <insight.icon className="w-4 h-4 text-[#3B82F6]" />
              </div>
              <p className="text-sm text-[#CCCCCC] leading-relaxed">
                {insight.text}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-[#4B5563]/20">
          <p className="text-xs text-[#888888] flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Atualizado automaticamente a cada semana
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
