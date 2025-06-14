
import React from 'react';
import { useTokenMonitoring } from '@/hooks/useTokenMonitoring';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Coins, 
  TrendingUp, 
  AlertTriangle, 
  Download, 
  RefreshCw,
  Calendar,
  BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const TokenMonitoringDashboard = () => {
  const { 
    stats, 
    userDetails, 
    usageHistory, 
    loading, 
    error, 
    refreshData, 
    triggerMonthlyReset, 
    exportTokenReport 
  } = useTokenMonitoring();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Erro ao carregar dados: {error}</p>
            <Button onClick={refreshData} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 90) return <Badge variant="destructive">Crítico</Badge>;
    if (percentage >= 50) return <Badge variant="secondary">Atenção</Badge>;
    return <Badge variant="default">Normal</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Monitoramento de Tokens</h2>
          <p className="text-gray-400">Dashboard administrativo do sistema de tokens</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={exportTokenReport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={triggerMonthlyReset} variant="default" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Reset Manual
          </Button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Usuários ativos na plataforma
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens Usados</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.totalTokensUsed || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Total consumido este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uso Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.averageUsage || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Tokens por usuário
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {(stats?.usersLowTokens || 0) + (stats?.usersOutOfTokens || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.usersOutOfTokens || 0} sem tokens, {stats?.usersLowTokens || 0} baixos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de uso diário */}
      {usageHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Histórico de Uso (30 dias)
            </CardTitle>
            <CardDescription>
              Consumo diário de tokens pelos usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={usageHistory.slice(0, 14).reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('pt-BR', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                />
                <YAxis tickFormatter={formatNumber} />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString('pt-BR')}
                  formatter={(value: number) => [formatNumber(value), 'Tokens']}
                />
                <Bar dataKey="total_tokens_used" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Lista de usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes dos Usuários</CardTitle>
          <CardDescription>
            Lista de usuários ordenada por maior uso de tokens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {userDetails.slice(0, 20).map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {user.full_name || `Usuário ${user.id.slice(0, 8)}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatNumber(user.total_available)} tokens disponíveis • 
                    Usado: {formatNumber(user.total_tokens_used)} total
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {user.usage_percentage}%
                  </span>
                  {getStatusBadge(user.usage_percentage)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
