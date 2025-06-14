
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Eye, MousePointer, Users, Plus, BarChart3 } from 'lucide-react';
import { usePerformanceAnalytics } from '@/hooks/usePerformanceAnalytics';
import { AddMetricsModal } from './AddMetricsModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const PerformanceDashboard = () => {
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([]);
  const { metrics, loading, getTopPerformers, getInsights } = usePerformanceAnalytics();
  const { user } = useAuth();

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('products')
        .select('id, name')
        .eq('user_id', user.id);

      setProducts(data || []);
    };

    fetchProducts();
  }, [user]);

  const insights = getInsights();
  const topPerformers = getTopPerformers();

  const metricsCards = [
    {
      title: 'Conversão Média',
      value: insights?.avgConversion ? `${insights.avgConversion}%` : 'N/A',
      icon: TrendingUp,
      color: 'text-[#10B981]',
      bgColor: 'bg-[#10B981]/10'
    },
    {
      title: 'ROI Médio',
      value: insights?.avgROI ? `${insights.avgROI}%` : 'N/A',
      icon: DollarSign,
      color: 'text-[#F59E0B]',
      bgColor: 'bg-[#F59E0B]/10'
    },
    {
      title: 'Campanhas Ativas',
      value: insights?.totalCampaigns.toString() || '0',
      icon: BarChart3,
      color: 'text-[#3B82F6]',
      bgColor: 'bg-[#3B82F6]/10'
    },
    {
      title: 'Melhor Performer',
      value: insights?.bestPerformer?.product_name || 'N/A',
      icon: Users,
      color: 'text-[#8B5CF6]',
      bgColor: 'bg-[#8B5CF6]/10'
    }
  ];

  const chartData = topPerformers.slice(0, 5).map(metric => ({
    name: metric.product_name.length > 15 
      ? `${metric.product_name.slice(0, 15)}...` 
      : metric.product_name,
    conversion: metric.conversion_rate || 0,
    roi: metric.roi_real || 0,
    sales: metric.sales_generated || 0
  }));

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Centro de Análise de Performance</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-[#1A1A1A] border-[#2A2A2A]">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-[#2A2A2A] rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-[#2A2A2A] rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Centro de Análise de Performance</h1>
          <p className="text-[#CCCCCC] mt-1">
            Analise o desempenho real das suas copies e identifique padrões de sucesso
          </p>
        </div>
        
        <AddMetricsModal 
          products={products}
          trigger={
            <Button className="bg-[#3B82F6] hover:bg-[#2563EB]">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Métricas
            </Button>
          }
        />
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricsCards.map((card, index) => (
          <Card key={index} className="bg-[#1A1A1A] border-[#2A2A2A] hover:border-[#3B82F6]/30 transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#CCCCCC]">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos e Rankings */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Gráfico de Performance */}
        <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
          <CardHeader>
            <CardTitle className="text-white">Top 5 Performers</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#CCCCCC"
                    fontSize={12}
                  />
                  <YAxis stroke="#CCCCCC" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1A1A1A', 
                      border: '1px solid #4B5563',
                      borderRadius: '8px',
                      color: '#CCCCCC'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="conversion" fill="#3B82F6" name="Conversão %" />
                  <Bar dataKey="roi" fill="#10B981" name="ROI %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-[#CCCCCC]">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-[#4B5563]" />
                  <p>Nenhum dado de performance disponível</p>
                  <p className="text-sm text-[#888888]">Adicione métricas das suas campanhas para ver os gráficos</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ranking de Melhores Copies */}
        <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
          <CardHeader>
            <CardTitle className="text-white">Ranking de Copies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.length > 0 ? (
                topPerformers.slice(0, 5).map((metric, index) => (
                  <div key={metric.id} className="flex items-center justify-between p-3 bg-[#2A2A2A]/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                        ${index === 0 ? 'bg-yellow-500/20 text-yellow-400' : 
                          index === 1 ? 'bg-gray-400/20 text-gray-300' :
                          index === 2 ? 'bg-orange-500/20 text-orange-400' :
                          'bg-[#4B5563]/20 text-[#CCCCCC]'}
                      `}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-white">{metric.product_name}</p>
                        <p className="text-sm text-[#888888]">{metric.copy_type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {metric.conversion_rate && (
                        <p className="text-sm font-medium text-[#10B981]">
                          {metric.conversion_rate}% conversão
                        </p>
                      )}
                      {metric.roi_real && (
                        <p className="text-sm text-[#CCCCCC]">
                          {metric.roi_real}% ROI
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-[#4B5563]" />
                  <p className="text-[#CCCCCC]">Nenhuma copy rankeada ainda</p>
                  <p className="text-sm text-[#888888]">Adicione métricas para ver o ranking</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights e Recomendações */}
      {insights && (
        <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
          <CardHeader>
            <CardTitle className="text-white">Insights Automáticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#10B981]/10 border border-[#10B981]/20 rounded-lg">
                <h4 className="font-medium text-[#10B981] mb-2">🎯 Melhor Performance</h4>
                <p className="text-sm text-[#CCCCCC]">
                  Sua copy "{insights.bestPerformer?.product_name}" teve o melhor desempenho geral.
                  Analise os padrões desta copy para replicar o sucesso.
                </p>
              </div>
              <div className="p-4 bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded-lg">
                <h4 className="font-medium text-[#3B82F6] mb-2">📊 Benchmark</h4>
                <p className="text-sm text-[#CCCCCC]">
                  Sua conversão média de {insights.avgConversion}% está 
                  {parseFloat(insights.avgConversion) > 2 ? ' acima' : ' dentro'} da média do mercado.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
