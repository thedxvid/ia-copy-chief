
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Activity, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  RefreshCw,
  Search,
  CreditCard,
  BarChart3
} from 'lucide-react';

interface TokenStats {
  totalUsers: number;
  totalTokensUsed: number;
  totalTokensAvailable: number;
  usersWithLowTokens: number;
  usersOutOfTokens: number;
  avgTokensPerUser: number;
}

interface UserTokenInfo {
  id: string;
  full_name: string;
  monthly_tokens: number;
  extra_tokens: number;
  total_tokens_used: number;
  total_available: number;
  subscription_status: string;
}

interface TokenUsage {
  feature_used: string;
  total_usage: number;
  user_count: number;
}

export const TokenMonitoringDashboard = () => {
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [users, setUsers] = useState<UserTokenInfo[]>([]);
  const [usage, setUsage] = useState<TokenUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStats = async () => {
    try {
      // Buscar estatísticas gerais
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('monthly_tokens, extra_tokens, total_tokens_used, subscription_status, full_name, id');

      if (profilesError) throw profilesError;

      if (profiles) {
        const totalUsers = profiles.length;
        const totalTokensUsed = profiles.reduce((sum, p) => sum + (p.total_tokens_used || 0), 0);
        const totalTokensAvailable = profiles.reduce((sum, p) => 
          sum + (p.monthly_tokens || 0) + (p.extra_tokens || 0), 0);
        
        const usersWithLowTokens = profiles.filter(p => {
          const available = (p.monthly_tokens || 0) + (p.extra_tokens || 0);
          return available > 0 && available < 10000;
        }).length;
        
        const usersOutOfTokens = profiles.filter(p => 
          ((p.monthly_tokens || 0) + (p.extra_tokens || 0)) <= 0
        ).length;
        
        const avgTokensPerUser = totalUsers > 0 ? Math.round(totalTokensAvailable / totalUsers) : 0;

        setStats({
          totalUsers,
          totalTokensUsed,
          totalTokensAvailable,
          usersWithLowTokens,
          usersOutOfTokens,
          avgTokensPerUser
        });

        // Preparar dados dos usuários
        const userTokenInfo: UserTokenInfo[] = profiles.map(p => ({
          id: p.id,
          full_name: p.full_name || 'Sem nome',
          monthly_tokens: p.monthly_tokens || 0,
          extra_tokens: p.extra_tokens || 0,
          total_tokens_used: p.total_tokens_used || 0,
          total_available: (p.monthly_tokens || 0) + (p.extra_tokens || 0),
          subscription_status: p.subscription_status || 'pending'
        }));

        setUsers(userTokenInfo.sort((a, b) => a.total_available - b.total_available));
      }

      // Buscar uso por funcionalidade
      const { data: usageData, error: usageError } = await supabase
        .from('token_usage')
        .select('feature_used, tokens_used, user_id')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (usageError) throw usageError;

      if (usageData) {
        const usageMap = new Map<string, { total: number; users: Set<string> }>();
        
        usageData.forEach(u => {
          const feature = u.feature_used || 'Desconhecido';
          if (!usageMap.has(feature)) {
            usageMap.set(feature, { total: 0, users: new Set() });
          }
          const current = usageMap.get(feature)!;
          current.total += u.tokens_used || 0;
          current.users.add(u.user_id);
        });

        const usageStats: TokenUsage[] = Array.from(usageMap.entries()).map(([feature, data]) => ({
          feature_used: feature,
          total_usage: data.total,
          user_count: data.users.size
        })).sort((a, b) => b.total_usage - a.total_usage);

        setUsage(usageStats);
      }

    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTokensColor = (available: number) => {
    if (available <= 0) return 'text-red-600 font-bold';
    if (available < 10000) return 'text-orange-600 font-semibold';
    if (available < 50000) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Monitoramento de Tokens</h2>
        </div>
        <Button onClick={fetchStats} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens Consumidos (30d)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.totalTokensUsed || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens Disponíveis</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.totalTokensAvailable || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários sem Tokens</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.usersOutOfTokens || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens Baixos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.usersWithLowTokens || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média por Usuário</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.avgTokensPerUser || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="usage">Uso por Funcionalidade</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usuários por Tokens</CardTitle>
              <CardDescription>Lista de usuários ordenada por tokens disponíveis</CardDescription>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <Badge className={getStatusColor(user.subscription_status)} variant="secondary">
                          {user.subscription_status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${getTokensColor(user.total_available)}`}>
                        {user.total_available.toLocaleString()} tokens
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.monthly_tokens.toLocaleString()} mensais + {user.extra_tokens.toLocaleString()} extras
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Usados: {user.total_tokens_used.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Uso por Funcionalidade (30 dias)</CardTitle>
              <CardDescription>Tokens consumidos por cada funcionalidade do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {usage.map((item, index) => (
                  <div key={item.feature_used} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.feature_used}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.user_count} usuário(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        {item.total_usage.toLocaleString()} tokens
                      </p>
                      <div className="w-24 bg-muted rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, (item.total_usage / Math.max(...usage.map(u => u.total_usage))) * 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
