
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const performanceData = [
  { name: 'Seg', ctr: 2.4, conversao: 1.8, engajamento: 65 },
  { name: 'Ter', ctr: 3.2, conversao: 2.1, engajamento: 72 },
  { name: 'Qua', ctr: 2.8, conversao: 2.4, engajamento: 68 },
  { name: 'Qui', ctr: 4.1, conversao: 3.2, engajamento: 78 },
  { name: 'Sex', ctr: 3.8, conversao: 2.9, engajamento: 75 },
  { name: 'Sáb', ctr: 2.2, conversao: 1.6, engajamento: 58 },
  { name: 'Dom', ctr: 1.9, conversao: 1.4, engajamento: 52 }
];

const projectDistribution = [
  { name: 'Email Marketing', value: 35, color: '#3B82F6' },
  { name: 'Landing Pages', value: 28, color: '#10B981' },
  { name: 'Anúncios', value: 22, color: '#F59E0B' },
  { name: 'Sales Pages', value: 15, color: '#8B5CF6' }
];

export const AnalyticsCharts = () => {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
        <CardHeader>
          <CardTitle className="text-white">Performance Semanal</CardTitle>
          <CardDescription className="text-[#CCCCCC]">
            CTR, Taxa de Conversão e Engajamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
              <XAxis dataKey="name" stroke="#CCCCCC" />
              <YAxis stroke="#CCCCCC" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1E1E1E', 
                  border: '1px solid #4B5563',
                  borderRadius: '8px',
                  color: '#CCCCCC'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="ctr" stroke="#3B82F6" strokeWidth={2} name="CTR %" />
              <Line type="monotone" dataKey="conversao" stroke="#10B981" strokeWidth={2} name="Conversão %" />
              <Line type="monotone" dataKey="engajamento" stroke="#F59E0B" strokeWidth={2} name="Engajamento %" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
        <CardHeader>
          <CardTitle className="text-white">Distribuição de Projetos</CardTitle>
          <CardDescription className="text-[#CCCCCC]">
            Por categoria de copy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={projectDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {projectDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1E1E1E', 
                  border: '1px solid #4B5563',
                  borderRadius: '8px',
                  color: '#CCCCCC'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {projectDistribution.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-[#CCCCCC]">{item.name}</span>
                <span className="text-sm text-white font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
