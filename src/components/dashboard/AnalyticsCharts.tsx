
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useCopyEvolution } from '@/hooks/useCopyEvolution';

const projectDistribution = [
  { name: 'Email Marketing', value: 35, color: '#3B82F6' },
  { name: 'Landing Pages', value: 28, color: '#10B981' },
  { name: 'Anúncios', value: 22, color: '#F59E0B' },
  { name: 'Sales Pages', value: 15, color: '#8B5CF6' }
];

export const AnalyticsCharts = () => {
  const { evolutionData, loading, isUsingExampleData, stats } = useCopyEvolution();

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
        <CardHeader>
          <CardTitle className="text-white">Evolução da Qualidade das Copies</CardTitle>
          <CardDescription className="text-[#CCCCCC]">
            Score de eficiência ao longo do tempo
            {isUsingExampleData && (
              <span className="block mt-1 text-xs text-yellow-400">
                📊 Dados de demonstração - Crie suas copies para ver dados reais
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-[#CCCCCC]">Carregando...</div>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#CCCCCC"
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis 
                    stroke="#CCCCCC" 
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1E1E1E', 
                      border: '1px solid #4B5563',
                      borderRadius: '8px',
                      color: '#CCCCCC'
                    }}
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return `Data: ${date.toLocaleDateString('pt-BR')}`;
                    }}
                    formatter={(value: any, name: any, props: any) => {
                      const item = props.payload;
                      return [
                        `${value}% - ${item.copyType}`,
                        item.productName
                      ];
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      return (
                        <circle 
                          cx={cx} 
                          cy={cy} 
                          r={6} 
                          fill={payload.color}
                          stroke="#1E1E1E"
                          strokeWidth={2}
                        />
                      );
                    }}
                    name="Score de Qualidade"
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* Estatísticas resumidas */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#4B5563]/20">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{stats.averageScore}%</div>
                  <div className="text-xs text-[#CCCCCC]">Score Médio</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-500">{stats.bestScore}%</div>
                  <div className="text-xs text-[#CCCCCC]">Melhor Score</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-blue-400 truncate">{stats.bestType}</div>
                  <div className="text-xs text-[#CCCCCC]">Tipo c/ Melhor Média</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-400">{stats.streak}</div>
                  <div className="text-xs text-[#CCCCCC]">Copies (7 dias)</div>
                </div>
              </div>
            </>
          )}
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
