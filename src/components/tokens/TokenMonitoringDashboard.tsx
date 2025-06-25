
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
  BarChart3,
  Zap,
  Mail,
  MailX
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
    forceRefresh,
    triggerMonthlyReset, 
    exportTokenReport 
  } = useTokenMonitoring();

  // 🔍 DEBUG: Log dos dados recebidos no componente
  React.useEffect(() => {
    console.log('🎯 COMPONENTE DEBUG: userDetails recebidos:', {
      length: userDetails.length,
      primeiro3: userDetails.slice(0, 3).map(u => ({
        id: u.id.slice(0, 8),
        name: u.full_name,
        email: u.email,
        hasEmail: !!u.email
      }))
    });
    
    if (userDetails.length > 0) {
      console.log('🔍 COMPONENTE DEBUG: Exemplo completo do primeiro usuário:', userDetails[0]);
    }
  }, [userDetails]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="bg-[#1E1E1E] border-[#4B5563]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20 bg-[#4B5563]" />
                <Skeleton className="h-4 w-4 bg-[#4B5563]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2 bg-[#4B5563]" />
                <Skeleton className="h-3 w-24 bg-[#4B5563]" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-[#1E1E1E] border-[#4B5563]">
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Erro ao carregar dados: {error}</p>
            <div className="flex gap-2 justify-center mt-4">
              <Button onClick={refreshData} variant="outline" className="border-[#4B5563] text-white hover:bg-[#2A2A2A]">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
              <Button onClick={forceRefresh} variant="default">
                <Zap className="h-4 w-4 mr-2" />
                Refresh Completo
              </Button>
            </div>
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

  // Função simplificada para exibir usuário - prioriza email
  const formatUserDisplay = (user: any) => {
    console.log('🎯 FORMATO DEBUG: Formatando usuário:', {
      id: user.id.slice(0, 8),
      name: user.full_name,
      email: user.email,
      hasEmail: !!user.email
    });

    // Priorizar email se disponível
    if (user.email) {
      return user.email;
    }
    
    // Fallback para nome se não tem email
    if (user.full_name) {
      return `${user.full_name} (sem email)`;
    }
    
    // Último fallback com ID
    return `Usuário ${user.id.slice(0, 8)} (sem email)`;
  };

  const getUserEmailIcon = (user: any) => {
    return user.email ? (
      <Mail className="h-3 w-3 text-green-500" />
    ) : (
      <MailX className="h-3 w-3 text-red-500" />
    );
  };

  // Estatísticas de emails
  const usersWithEmail = userDetails.filter(u => u.email).length;
  const usersWithoutEmail = userDetails.length - usersWithEmail;
  const emailPercentage = userDetails.length > 0 ? ((usersWithEmail / userDetails.length) * 100).toFixed(1) : '0';

  // 🔍 DEBUG: Log das estatísticas de email
  console.log('📧 ESTATÍSTICAS EMAIL DEBUG:', {
    totalUsers: userDetails.length,
    usersWithEmail,
    usersWithoutEmail,
    emailPercentage,
    exemploUsuarios: userDetails.slice(0, 3).map(u => ({ name: u.full_name, email: u.email }))
  });

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Monitoramento de Créditos</h2>
          <p className="text-gray-400">Dashboard administrativo do sistema de créditos</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshData} variant="outline" size="sm" className="border-[#4B5563] text-white hover:bg-[#2A2A2A]">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={forceRefresh} variant="default" size="sm">
            <Zap className="h-4 w-4 mr-2" />
            Refresh Total
          </Button>
          <Button onClick={exportTokenReport} variant="outline" size="sm" className="border-[#4B5563] text-white hover:bg-[#2A2A2A]">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={triggerMonthlyReset} variant="default" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Reset Manual
          </Button>
        </div>
      </div>

      {/* Debug Card - Mostrando informações sobre emails */}
      <Card className="bg-[#1E1E1E] border-[#4B5563]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Mail className="h-5 w-5" />
            Status dos Emails (Debug)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{userDetails.length}</div>
              <p className="text-sm text-gray-400">Total usuários</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{usersWithEmail}</div>
              <p className="text-sm text-gray-400">Com email</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{usersWithoutEmail}</div>
              <p className="text-sm text-gray-400">Sem email</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{emailPercentage}%</div>
              <p className="text-sm text-gray-400">Taxa de sucesso</p>
            </div>
          </div>
          
          {/* Exemplo de 3 primeiros usuários para debug */}
          <div className="mt-4 p-3 bg-[#2A2A2A] rounded-lg">
            <p className="text-xs text-gray-400 mb-2">Debug - Primeiros 3 usuários:</p>
            {userDetails.slice(0, 3).map((user, index) => (
              <div key={user.id} className="text-xs text-gray-300 mb-1">
                {index + 1}. {user.full_name} - Email: {user.email || 'NENHUM'} - Tem email: {user.email ? 'SIM' : 'NÃO'}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[#1E1E1E] border-[#4B5563]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Usuários ativos na plataforma
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-[#4B5563]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Créditos Usados</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatNumber(stats?.totalTokensUsed || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Total consumido este mês
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-[#4B5563]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Uso Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatNumber(stats?.averageUsage || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Créditos por usuário
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-[#4B5563]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Alertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {(stats?.usersLowTokens || 0) + (stats?.usersOutOfTokens || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.usersOutOfTokens || 0} sem créditos, {stats?.usersLowTokens || 0} baixos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de uso diário */}
      <Card className="bg-[#1E1E1E] border-[#4B5563]">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Histórico de Uso (30 dias)
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>{usageHistory.length} dias com dados</span>
              <Button onClick={forceRefresh} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Consumo diário de créditos pelos usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usageHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={usageHistory.slice(0, 14).reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                <XAxis 
                  dataKey="date" 
                  stroke="#CCCCCC"
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                />
                <YAxis 
                  stroke="#CCCCCC"
                  tickFormatter={formatNumber} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1E1E1E', 
                    border: '1px solid #4B5563',
                    borderRadius: '8px',
                    color: '#CCCCCC'
                  }}
                  labelFormatter={(date) => {
                    const d = new Date(date);
                    return `Data: ${d.toLocaleDateString('pt-BR')}`;
                  }}
                  formatter={(value: number) => [formatNumber(value), 'Créditos']}
                />
                <Bar dataKey="total_tokens_used" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Nenhum dado de uso encontrado</p>
                <p className="text-sm text-gray-500 mt-2">
                  Dados aparecerão aqui quando houver uso de tokens
                </p>
                <Button onClick={forceRefresh} variant="outline" size="sm" className="mt-4 border-[#4B5563] text-white hover:bg-[#2A2A2A]">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Verificar Novamente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de usuários - agora com emails em destaque */}
      <Card className="bg-[#1E1E1E] border-[#4B5563]">
        <CardHeader>
          <CardTitle className="text-white">Detalhes dos Usuários</CardTitle>
          <CardDescription>
            Lista de usuários ordenada por maior uso de créditos • 
            <span className="text-green-400">{usersWithEmail} com email</span> • 
            <span className="text-red-400">{usersWithoutEmail} sem email</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {userDetails.slice(0, 25).map((user, index) => {
              console.log(`🎯 RENDER DEBUG usuário ${index + 1}:`, {
                id: user.id.slice(0, 8),
                name: user.full_name,
                email: user.email,
                hasEmail: !!user.email,
                formatResult: formatUserDisplay(user)
              });

              return (
                <div key={user.id} className="flex items-center justify-between p-3 border border-gray-600 rounded-lg bg-[#2A2A2A]">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getUserEmailIcon(user)}
                      <p className="font-medium text-sm text-white">
                        {formatUserDisplay(user)}
                      </p>
                    </div>
                    {/* Informações adicionais do usuário */}
                    <p className="text-xs text-gray-400 pl-5 mt-1">
                      {formatNumber(user.total_available)} créditos disponíveis • 
                      Usado: {formatNumber(user.total_tokens_used)} total
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {user.usage_percentage}%
                    </span>
                    {getStatusBadge(user.usage_percentage)}
                  </div>
                </div>
              );
            })}
          </div>
          
          {userDetails.length > 25 && (
            <div className="mt-4 p-3 text-center text-gray-400 text-sm border-t border-gray-600">
              Mostrando 25 de {userDetails.length} usuários • Use o botão "Exportar" para ver todos
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
