
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, Trophy, Award } from 'lucide-react';

const goals = [
  {
    title: 'Projetos Criados',
    current: 7,
    target: 10,
    unit: 'projetos',
    color: 'bg-[#3B82F6]'
  },
  {
    title: 'Taxa de Conversão',
    current: 2.8,
    target: 3.0,
    unit: '%',
    color: 'bg-[#10B981]'
  },
  {
    title: 'Palavras Escritas',
    current: 18,
    target: 25,
    unit: 'k palavras',
    color: 'bg-[#F59E0B]'
  }
];

const badges = [
  { name: 'Primeiro Projeto', icon: Trophy, earned: true },
  { name: 'Meta Mensal', icon: Target, earned: true },
  { name: 'Copywriter Pro', icon: Award, earned: false }
];

export const GoalsProgress = () => {
  return (
    <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
      <CardHeader>
        <CardTitle className="text-white">Metas & Progresso</CardTitle>
        <CardDescription className="text-[#CCCCCC]">
          Suas metas mensais e conquistas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {goals.map((goal, index) => {
            const percentage = (goal.current / goal.target) * 100;
            return (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white">{goal.title}</span>
                  <span className="text-[#CCCCCC]">
                    {goal.current}/{goal.target} {goal.unit}
                  </span>
                </div>
                <Progress 
                  value={percentage} 
                  className="h-2"
                />
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-[#4B5563]/20">
          <h4 className="text-sm font-medium text-white mb-3">Conquistas</h4>
          <div className="grid grid-cols-3 gap-2">
            {badges.map((badge, index) => (
              <div 
                key={index} 
                className={`flex flex-col items-center p-2 rounded-lg text-center transition-all ${
                  badge.earned 
                    ? 'bg-[#3B82F6]/10 text-[#3B82F6]' 
                    : 'bg-[#2A2A2A] text-[#888888]'
                }`}
              >
                <badge.icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">
                  {badge.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
