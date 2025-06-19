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

interface UserEmail {
  id: string;
  email: string;
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

      // Buscar todos os usuários da tabela profiles
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          monthly_tokens,
          extra_tokens,
          total_tokens_used,
          tokens_reset_date,
          subscription_status
        `)
        .order('created_at', { ascending: false });

      console.log('📊 Resultado da busca de profiles:', { 
        profiles: usersData?.length || 0, 
        error: usersError 
      });

      if (usersError) {
        console.error('❌ Erro ao buscar profiles:', usersError);
        throw usersError;
      }

      if (!usersData || usersData.length === 0) {
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

      console.log('👥 Profiles encontrados:', usersData.length);
      console.log('📋 Detalhes dos profiles:', usersData.map(p => ({ 
        id: p.id.slice(0, 8), 
        name: p.full_name || 'Sem nome',
        monthly: p.monthly_tokens, 
        extra: p.extra_tokens 
      })));

      // Buscar emails dos usuários usando a função RPC
      let emailMap: { [key: string]: string } = {};
      
      try {
        const { data: emailsData, error: emailsError } = await supabase
          .rpc('get_user_emails', {
            user_ids: usersData.map(u => u.id)
          });

        if (emailsError) {
          console.warn('⚠️ Erro ao buscar emails via RPC:', emailsError);
          console.log('📧 Continuando sem emails...');
        } else if (emailsData && Array.isArray(emailsData)) {
          console.log('📧 Emails encontrados via RPC:', emailsData.length);
          (emailsData as UserEmail[]).forEach((item) => {
            emailMap[item.id] = item.email;
          });
        }
      } catch (rpcError) {
        console.warn('⚠️ Fallback: RPC não disponível, continuando sem emails:', rpcError);
      }

      // Processar dados dos usuários
      const processedUsers: UserTokenData[] = usersData.map(profile => {
        const totalAvailable = (profile.monthly_tokens || 0) + (profile.extra_tokens || 0);
        const monthlyLimit = 100000; // Limite padrão mensal atual
        const tokensUsed = profile.total_tokens_used || 0;
        const usagePercentage = totalAvailable > 0 
          ? Math.round((tokensUsed / (tokensUsed + totalAvailable)) * 100)
          : 0;

        return {
          id: profile.id,
          full_name: profile.full_name,
          email: emailMap[profile.id] || null,
          monthly_tokens: profile.monthly_tokens || 0,
          extra_tokens: profile.extra_tokens || 0,
          total_tokens_used: tokensUsed,
          tokens_reset_date: profile.tokens_reset_date || new Date().toISOString().split('T')[0],
          total_available: totalAvailable,
          usage_percentage: Math.max(0, Math.min(100, usagePercentage))
        };
      });

      console.log('🔄 Usuários processados:', processedUsers.length);
      console.log('👥 Detalhes dos usuários processados:', processedUsers.map(u => ({
        id: u.id.slice(0, 8),
        name: u.full_name || 'Sem nome',
        email: u.email || 'Sem email',
        available: u.total_available,
        used: u.total_tokens_used
      })));

      // Calcular estatísticas
      const totalUsers = usersData.length;
      const totalTokensUsed = usersData.reduce((sum, p) => sum + (p.total_tokens_used || 0), 0);
      const totalTokensAvailable = usersData.reduce((sum, p) => sum + (p.monthly_tokens || 0) + (p.extra_tokens || 0), 0);
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

      setStats(calculatedStats);
      setUserDetails(processedUsers.sort((a, b) => b.total_available - a.total_available));

      console.log('✅ Dados atualizados com sucesso - Total de usuários:', processedUsers.length);

    } catch (err) {
      console.error('❌ Erro ao buscar estatísticas de créditos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      
      toast.error('Erro ao carregar dados', {
        description: 'Falha ao buscar informações dos usuários. Verifique os logs do console.',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsageHistory = useCallback(async () => {
    try {
      console.log('📊 Buscando histórico de uso...');

      // Buscar histórico de uso dos últimos 30 dias
      const { data: usage, error: usageError } = await supabase
        .from('token_usage')
        .select('created_at, tokens_used, feature_used, user_id')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
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

      // Agrupar por data
      const dailyUsage: { [key: string]: TokenUsageHistory } = {};
      const uniqueUsers: { [key: string]: Set<string> } = {};

      usage.forEach(record => {
        const date = new Date(record.created_at).toISOString().split('T')[0];
        
        if (!dailyUsage[date]) {
          dailyUsage[date] = {
            date,
            total_tokens_used: 0,
            unique_users: 0,
            feature_breakdown: {}
          };
          uniqueUsers[date] = new Set();
        }

        dailyUsage[date].total_tokens_used += record.tokens_used;
        uniqueUsers[date].add(record.user_id);
        
        if (!dailyUsage[date].feature_breakdown[record.feature_used]) {
          dailyUsage[date].feature_breakdown[record.feature_used] = 0;
        }
        dailyUsage[date].feature_breakdown[record.feature_used] += record.tokens_used;
      });

      // Atualizar contagem de usuários únicos
      Object.keys(dailyUsage).forEach(date => {
        dailyUsage[date].unique_users = uniqueUsers[date].size;
      });

      const historyArray = Object.values(dailyUsage).sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setUsageHistory(historyArray.slice(0, 30)); // Últimos 30 dias
      console.log('✅ Histórico processado:', historyArray.length, 'dias');

    } catch (err) {
      console.error('❌ Erro ao buscar histórico de uso:', err);
    }
  }, []);

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
    triggerMonthlyReset,
    exportTokenReport
  };
};
