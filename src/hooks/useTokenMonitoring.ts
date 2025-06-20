
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TokenStats {
  totalUsers: number;
  totalTokensUsed: number;
  totalTokensAvailable: number;
  averageUsage: number;
  usersLowTokens: number;
  usersOutOfTokens: number;
}

interface UserTokenData {
  id: string;
  full_name: string | null;
  email: string | null;
  monthly_tokens: number;
  extra_tokens: number;
  total_tokens_used: number;
  tokens_reset_date: string;
  total_available: number;
  usage_percentage: number;
}

interface TokenUsageHistory {
  date: string;
  total_tokens_used: number;
  unique_users: number;
  feature_breakdown: { [key: string]: number };
}

export const useTokenMonitoring = () => {
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [userDetails, setUserDetails] = useState<UserTokenData[]>([]);
  const [usageHistory, setUsageHistory] = useState<TokenUsageHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTokenStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Iniciando busca de estatísticas de créditos...');

      // Buscar TODOS os usuários da tabela profiles
      console.log('📊 Buscando todos os profiles...');
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📊 Query executada - Resultado:', { 
        profiles: profilesData?.length || 0, 
        error: profilesError 
      });

      if (profilesError) {
        console.error('❌ Erro ao buscar profiles:', profilesError);
        throw profilesError;
      }

      if (!profilesData || profilesData.length === 0) {
        console.log('⚠️ Nenhum perfil encontrado');
        setStats({
          totalUsers: 0,
          totalTokensUsed: 0,
          totalTokensAvailable: 0,
          averageUsage: 0,
          usersLowTokens: 0,
          usersOutOfTokens: 0
        });
        setUserDetails([]);
        return;
      }

      console.log('👥 Total de profiles encontrados:', profilesData.length);

      // Processar TODOS os usuários encontrados
      const processedUsers: UserTokenData[] = profilesData.map((profile, index) => {
        console.log(`🔄 Processando usuário ${index + 1}:`, {
          id: profile.id.slice(0, 8),
          name: profile.full_name || 'Sem nome',
          monthly: profile.monthly_tokens,
          extra: profile.extra_tokens,
          used: profile.total_tokens_used
        });

        const totalAvailable = (profile.monthly_tokens || 0) + (profile.extra_tokens || 0);
        const tokensUsed = profile.total_tokens_used || 0;
        const usagePercentage = totalAvailable > 0 
          ? Math.round((tokensUsed / (tokensUsed + totalAvailable)) * 100)
          : 0;

        return {
          id: profile.id,
          full_name: profile.full_name,
          email: null, // Será preenchido depois
          monthly_tokens: profile.monthly_tokens || 0,
          extra_tokens: profile.extra_tokens || 0,
          total_tokens_used: tokensUsed,
          tokens_reset_date: profile.tokens_reset_date || new Date().toISOString().split('T')[0],
          total_available: totalAvailable,
          usage_percentage: Math.max(0, Math.min(100, usagePercentage))
        };
      });

      console.log('✅ Usuários processados:', processedUsers.length);

      // Calcular estatísticas
      const totalUsers = profilesData.length;
      const totalTokensUsed = profilesData.reduce((sum, p) => sum + (p.total_tokens_used || 0), 0);
      const totalTokensAvailable = profilesData.reduce((sum, p) => sum + (p.monthly_tokens || 0) + (p.extra_tokens || 0), 0);
      const averageUsage = totalUsers > 0 ? Math.round(totalTokensUsed / totalUsers) : 0;
      
      const usersLowTokens = processedUsers.filter(user => 
        user.total_available < 5000 && user.total_available > 0
      ).length;
      
      const usersOutOfTokens = processedUsers.filter(user => 
        user.total_available === 0
      ).length;

      const calculatedStats = {
        totalUsers,
        totalTokensUsed,
        totalTokensAvailable,
        averageUsage,
        usersLowTokens,
        usersOutOfTokens
      };

      console.log('📈 Estatísticas calculadas:', calculatedStats);

      // Definir os dados
      setStats(calculatedStats);
      setUserDetails(processedUsers.sort((a, b) => b.total_tokens_used - a.total_tokens_used));

      console.log('✅ Dados definidos com sucesso - Total de usuários:', processedUsers.length);

      // Tentar buscar emails dos usuários
      try {
        console.log('📧 Tentando buscar emails dos usuários...');
        const userIds = profilesData.map(u => u.id);

        const { data: emailsData, error: emailsError } = await supabase
          .rpc('get_user_emails', {
            user_ids: userIds
          });

        if (emailsError) {
          console.warn('⚠️ Erro ao buscar emails via RPC:', emailsError);
        } else if (emailsData && Array.isArray(emailsData)) {
          console.log('📧 Emails encontrados via RPC:', emailsData.length);
          
          // Atualizar usuários com emails
          const updatedUsers = processedUsers.map(user => {
            const emailInfo = emailsData.find((e: any) => e.id === user.id);
            return {
              ...user,
              email: emailInfo?.email || null
            };
          });
          
          setUserDetails(updatedUsers.sort((a, b) => b.total_tokens_used - a.total_tokens_used));
          console.log('✅ Emails atualizados para usuários');
        }
      } catch (emailError) {
        console.warn('⚠️ Erro ao buscar emails (não crítico):', emailError);
      }

    } catch (err) {
      console.error('❌ Erro ao buscar estatísticas de créditos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      
      toast.error('Erro ao carregar dados', {
        description: 'Falha ao buscar informações dos usuários.',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsageHistory = useCallback(async () => {
    try {
      console.log('📊 Buscando histórico de uso...');

      // Buscar registros dos últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      console.log('📅 Buscando registros desde:', thirtyDaysAgo.toISOString());

      const { data: usage, error: usageError } = await supabase
        .from('token_usage')
        .select('created_at, tokens_used, feature_used, user_id')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      console.log('📈 Histórico de uso encontrado:', usage?.length || 0, 'registros');

      if (usageError) {
        console.error('❌ Erro ao buscar histórico:', usageError);
        throw usageError;
      }

      if (!usage || usage.length === 0) {
        console.log('⚠️ Nenhum histórico de uso encontrado');
        setUsageHistory([]);
        return;
      }

      // Debug: mostrar os dados brutos
      console.log('🔍 Dados brutos do histórico:', usage.slice(0, 5));

      // Agrupar por data usando UTC para evitar problemas de timezone
      const dailyUsage: { [key: string]: TokenUsageHistory } = {};
      const uniqueUsers: { [key: string]: Set<string> } = {};

      usage.forEach(record => {
        // Usar UTC para evitar problemas de timezone
        const date = new Date(record.created_at);
        const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
        const dateKey = utcDate.toISOString().split('T')[0];
        
        console.log(`📅 Processando registro: ${record.created_at} -> ${dateKey}`);
        
        if (!dailyUsage[dateKey]) {
          dailyUsage[dateKey] = {
            date: dateKey,
            total_tokens_used: 0,
            unique_users: 0,
            feature_breakdown: {}
          };
          uniqueUsers[dateKey] = new Set();
        }

        dailyUsage[dateKey].total_tokens_used += record.tokens_used;
        uniqueUsers[dateKey].add(record.user_id);
        
        if (!dailyUsage[dateKey].feature_breakdown[record.feature_used]) {
          dailyUsage[dateKey].feature_breakdown[record.feature_used] = 0;
        }
        dailyUsage[dateKey].feature_breakdown[record.feature_used] += record.tokens_used;
      });

      // Atualizar contagem de usuários únicos
      Object.keys(dailyUsage).forEach(date => {
        dailyUsage[date].unique_users = uniqueUsers[date].size;
      });

      const historyArray = Object.values(dailyUsage).sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      console.log('📊 Histórico processado:', historyArray.length, 'dias');
      console.log('🔍 Dados processados:', historyArray.slice(0, 5));

      setUsageHistory(historyArray.slice(0, 30));

      // Toast de sucesso quando dados são atualizados
      toast.success('Histórico atualizado!', {
        description: `${historyArray.length} dias de dados carregados`,
        duration: 3000,
      });

    } catch (err) {
      console.error('❌ Erro ao buscar histórico de uso:', err);
      toast.error('Erro ao carregar histórico', {
        description: 'Falha ao buscar dados de uso de tokens',
        duration: 5000,
      });
    }
  }, []);

  // Configurar subscriptions em tempo real
  useEffect(() => {
    console.log('🔄 Configurando subscriptions do dashboard de monitoramento...');

    const timestamp = Date.now();
    
    // Subscription para mudanças na tabela profiles
    const profilesChannelName = `monitoring-profiles-${timestamp}`;
    const profilesChannel = supabase
      .channel(profilesChannelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          console.log('🔄 Perfil atualizado (monitoramento):', payload);
          
          // Verificar se os campos de token foram alterados
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          
          const tokenFieldsChanged = 
            newRecord.monthly_tokens !== oldRecord.monthly_tokens ||
            newRecord.extra_tokens !== oldRecord.extra_tokens ||
            newRecord.total_tokens_used !== oldRecord.total_tokens_used;

          if (tokenFieldsChanged) {
            console.log('💰 Tokens de usuário alterados, recarregando estatísticas...');
            fetchTokenStats();
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Status da subscription de profiles (monitoramento):', status);
      });

    // Subscription para novos registros de uso de tokens
    const usageChannelName = `monitoring-usage-${timestamp}`;
    const usageChannel = supabase
      .channel(usageChannelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'token_usage',
        },
        (payload) => {
          console.log('🔄 Novo uso de token registrado:', payload);
          
          // Recarregar estatísticas e histórico imediatamente
          fetchTokenStats();
          fetchUsageHistory();
          
          toast.info('📊 Dados atualizados em tempo real', {
            description: 'Novo uso de token detectado',
            duration: 3000,
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 Status da subscription de token usage:', status);
      });

    return () => {
      console.log('🧹 Limpando subscriptions do monitoramento');
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(usageChannel);
    };
  }, [fetchTokenStats, fetchUsageHistory]);

  const triggerMonthlyReset = useCallback(async () => {
    try {
      console.log('🔄 Executando reset mensal manual...');
      
      const { data, error } = await supabase.functions.invoke('monthly-token-reset');

      if (error) {
        console.error('❌ Erro no reset mensal:', error);
        throw error;
      }

      console.log('✅ Reset mensal executado:', data);

      toast.success('Reset Mensal Executado!', {
        description: `Reset realizado com sucesso para ${data.stats?.usersAffected || 0} usuários.`,
        duration: 5000,
      });

      // Atualizar dados após reset
      await fetchTokenStats();

    } catch (err) {
      console.error('❌ Erro no reset mensal:', err);
      toast.error('Erro no Reset', {
        description: 'Falha ao executar o reset mensal de créditos.',
        duration: 5000,
      });
    }
  }, [fetchTokenStats]);

  const exportTokenReport = useCallback(() => {
    if (!userDetails.length) {
      toast.error('Nenhum dado para exportar', {
        description: 'Não há informações de usuários disponíveis.',
      });
      return;
    }

    try {
      const csvData = [
        ['Nome', 'Email', 'Créditos Mensais', 'Créditos Extra', 'Total Disponível', 'Créditos Usados', 'Uso (%)', 'Data Reset'],
        ...userDetails.map(user => [
          user.full_name || 'Sem nome',
          user.email || 'Sem email',
          user.monthly_tokens,
          user.extra_tokens,
          user.total_available,
          user.total_tokens_used, 
          user.usage_percentage,
          user.tokens_reset_date
        ])
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-creditos-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      toast.success('Relatório Exportado!', {
        description: 'Relatório de créditos baixado com sucesso.',
      });

      console.log('📊 Relatório exportado:', userDetails.length, 'usuários');
    } catch (err) {
      console.error('❌ Erro ao exportar relatório:', err);
      toast.error('Erro na Exportação', {
        description: 'Falha ao gerar o relatório.',
      });
    }
  }, [userDetails]);

  // Função para refresh manual
  const forceRefresh = useCallback(async () => {
    console.log('🔄 Refresh manual iniciado...');
    toast.info('Atualizando dados...', {
      description: 'Carregando dados mais recentes',
      duration: 2000,
    });
    
    await Promise.all([
      fetchTokenStats(),
      fetchUsageHistory()
    ]);
  }, [fetchTokenStats, fetchUsageHistory]);

  useEffect(() => {
    console.log('🚀 Iniciando carregamento do dashboard de monitoramento...');
    fetchTokenStats();
    fetchUsageHistory();
  }, [fetchTokenStats, fetchUsageHistory]);

  return {
    stats,
    userDetails,
    usageHistory,
    loading,
    error,
    refreshData: fetchTokenStats,
    forceRefresh,
    triggerMonthlyReset,
    exportTokenReport
  };
};
