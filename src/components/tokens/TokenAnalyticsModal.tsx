
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, TrendingUp, Zap, BarChart3, PieChart as PieIcon, Clock } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface TokenAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UsageData {
  date: string;
  tokens: number;
  feature: string;
}

interface FeatureStats {
  name: string;
  tokens: number;
  color: string;
  percentage: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

// Mapeamento de features técnicas para nomes amigáveis
const FEATURE_NAMES: { [key: string]: string } = {
  'agent_chat_claude4': 'Chat com IA',
  'chat_Agente Copy': 'Agente de Copy',
  'copy_generation_vsl': 'Vídeo de Vendas',
  'copy_generation_ads': 'Anúncios',
  'copy_generation_product': 'Descrição de Produtos',
  'copy_generation_landing': 'Landing Pages',
  'chat_Agente Headlines': 'Headlines',
  'custom_agent_chat': 'Agente Personalizado',
  'chat': 'Chat Geral',
  'copy': 'Geração de Copy',
  // Adicionar mais mapeamentos conforme necessário
};

const getFeatureName = (technicalName: string): string => {
  return FEATURE_NAMES[technicalName] || technicalName
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const TokenAnalyticsModal: React.FC<TokenAnalyticsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dailyUsage, setDailyUsage] = useState<UsageData[]>([]);
  const [featureStats, setFeatureStats] = useState<FeatureStats[]>([]);
  const [totalTokens, setTotalTokens] = useState(0);
  const [averageDaily, setAverageDaily] = useState(0);

  const fetchAnalytics = React.useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Buscar dados dos últimos 30 dias
      const thirtyDaysAgo = startOfDay(subDays(new Date(), 30));
      
      const { data: usage, error } = await supabase
        .from('token_usage')
        .select('created_at, tokens_used, feature_used')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Processar dados diários
      const dailyMap = new Map<string, number>();
      const featureMap = new Map<string, number>();
      let total = 0;

      usage?.forEach((item) => {
        const date = format(new Date(item.created_at), 'dd/MM', { locale: ptBR });
        const currentDaily = dailyMap.get(date) || 0;
        const currentFeature = featureMap.get(item.feature_used) || 0;
        
        dailyMap.set(date, currentDaily + item.tokens_used);
        featureMap.set(item.feature_used, currentFeature + item.tokens_used);
        total += item.tokens_used;
      });

      // Converter para arrays
      const dailyData = Array.from(dailyMap.entries()).map(([date, tokens]) => ({
        date,
        tokens,
        feature: 'total'
      }));

      const featureData = Array.from(featureMap.entries()).map(([name, tokens], index) => ({
        name: getFeatureName(name),
        tokens,
        color: COLORS[index % COLORS.length],
        percentage: Math.round((tokens / total) * 100)
      })).sort((a, b) => b.tokens - a.tokens);

      setDailyUsage(dailyData);
      setFeatureStats(featureData);
      setTotalTokens(total);
      setAverageDaily(Math.round(total / 30));

    } catch (error) {
      console.error('Erro ao buscar analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Configurar subscription em tempo real para analytics do usuário
  useEffect(() => {
    if (!isOpen || !user?.id) return;

    console.log('🔄 Configurando subscription de analytics para usuário:', user.id);

    const channelName = `analytics-${user.id}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'token_usage',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔄 Novo uso de token para analytics:', payload);
          
          // Recarregar analytics automaticamente
          fetchAnalytics();
          
          toast.info('📊 Analytics atualizados', {
            description: 'Novo uso de tokens detectado',
            duration: 3000,
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 Status da subscription de analytics:', status);
      });

    return () => {
      console.log('🧹 Limpando subscription de analytics');
      supabase.removeChannel(channel);
    };
  }, [isOpen, user?.id, fetchAnalytics]);

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchAnalytics();
    }
  }, [isOpen, user?.id, fetchAnalytics]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] bg-[#0A0A0A] border-[#2A2A2A] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BarChart3 className="h-5 w-5 text-[#3B82F6]" />
            Analytics de Créditos
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B82F6]"></div>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="flex-1">
            <TabsList className="grid w-full grid-cols-3 bg-[#1E1E1E]">
              <TabsTrigger value="overview" className="data-[state=active]:bg-[#3B82F6]">
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="timeline" className="data-[state=active]:bg-[#3B82F6]">
                Timeline
              </TabsTrigger>
              <TabsTrigger value="features" className="data-[state=active]:bg-[#3B82F6]">
                Por Feature
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-[#2A2A2A]">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-[#3B82F6]" />
                    <span className="text-sm text-gray-400">Total (30 dias)</span>
                  </div>
                  <p className="text-2xl font-bold">{totalTokens.toLocaleString()}</p>
                </div>

                <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-[#2A2A2A]">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-400">Média Diária</span>
                  </div>
                  <p className="text-2xl font-bold">{averageDaily.toLocaleString()}</p>
                </div>

                <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-[#2A2A2A]">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-gray-400">Features Ativas</span>
                  </div>
                  <p className="text-2xl font-bold">{featureStats.length}</p>
                </div>
              </div>

              <div className="bg-[#1E1E1E] p-6 rounded-2xl border border-[#2A2A2A]">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <PieIcon className="h-5 w-5 text-[#3B82F6]" />
                  Distribuição por Feature
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={featureStats}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="tokens"
                        label={({ name, percentage }) => `${name} ${percentage}%`}
                      >
                        {featureStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1E1E1E',
                          border: '1px solid #2A2A2A',
                          borderRadius: '8px',
                          color: 'white'
                        }}
                        formatter={(value: number) => [value.toLocaleString() + ' créditos', 'Uso']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <div className="bg-[#1E1E1E] p-6 rounded-2xl border border-[#2A2A2A]">
                <h3 className="text-lg font-semibold mb-4">Uso Diário (Últimos 30 dias)</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyUsage}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#666"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="#666"
                        fontSize={12}
                        tickFormatter={(value) => value.toLocaleString()}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1E1E1E',
                          border: '1px solid #2A2A2A',
                          borderRadius: '8px',
                          color: 'white'
                        }}
                        formatter={(value: number) => [value.toLocaleString() + ' créditos', 'Créditos']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="tokens" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              <div className="grid gap-4">
                {featureStats.map((feature, index) => (
                  <div key={index} className="bg-[#1E1E1E] p-4 rounded-2xl border border-[#2A2A2A]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div 
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: feature.color }}
                        />
                        <span className="font-medium truncate">{feature.name}</span>
                        <Badge variant="secondary" className="bg-[#2A2A2A] text-white flex-shrink-0">
                          {feature.percentage}%
                        </Badge>
                      </div>
                      <span className="text-lg font-bold flex-shrink-0 ml-2">
                        {feature.tokens.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-[#2A2A2A] rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${feature.percentage}%`,
                          backgroundColor: feature.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        <div className="flex justify-end pt-4 border-t border-[#2A2A2A]">
          <Button onClick={onClose} variant="outline" className="border-[#2A2A2A]">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
