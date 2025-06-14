
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

      // Buscar estatísticas gerais dos usuários
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, monthly_tokens, extra_tokens, total_tokens_used, tokens_reset_date');

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        setStats({
          totalUsers: 0,
          totalTokensUsed: 0,
          totalTokensAvailable: 0,
          averageUsage: 0,
          usersLowTokens: 0,
          usersOutOfTokens: 0
        });
        return;
      }

      // Processar dados dos usuários
      const processedUsers: UserTokenData[] = profiles.map(profile => {
        const totalAvailable = profile.monthly_tokens + profile.extra_tokens;
        const usagePercentage = totalAvailable > 0 
          ? Math.round(((25000 - totalAvailable) / 25000) * 100)
          : 100;

        return {
          id: profile.id,
          full_name: profile.full_name,
          monthly_tokens: profile.monthly_tokens,
          extra_tokens: profile.extra_tokens,
          total_tokens_used: profile.total_tokens_used,
          tokens_reset_date: profile.tokens_reset_date,
          total_available: totalAvailable,
          usage_percentage: usagePercentage
        };
      });

      // Calcular estatísticas
      const totalUsers = profiles.length;
      const totalTokensUsed = profiles.reduce((sum, p) => sum + (p.total_tokens_used || 0), 0);
      const totalTokensAvailable = profiles.reduce((sum, p) => sum + p.monthly_tokens + p.extra_tokens, 0);
      const averageUsage = totalUsers > 0 ? Math.round(totalTokensUsed / totalUsers) : 0;
      
      const usersLowTokens = processedUsers.filter(user => 
        user.total_available < 5000 && user.total_available > 0
      ).length;
      
      const usersOutOfTokens = processedUsers.filter(user => 
        user.total_available === 0
      ).length;

      setStats({
        totalUsers,
        totalTokensUsed,
        totalTokensAvailable,
        averageUsage,
        usersLowTokens,
        usersOutOfTokens
      });

      setUserDetails(processedUsers.sort((a, b) => b.usage_percentage - a.usage_percentage));

    } catch (err) {
      console.error('Erro ao buscar estatísticas de tokens:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsageHistory = useCallback(async () => {
    try {
      // Buscar histórico de uso dos últimos 30 dias
      const { data: usage, error: usageError } = await supabase
        .from('token_usage')
        .select('created_at, tokens_used, feature_used')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (usageError) throw usageError;

      if (!usage || usage.length === 0) {
        setUsageHistory([]);
        return;
      }

      // Agrupar por data
      const dailyUsage: { [key: string]: TokenUsageHistory } = {};

      usage.forEach(record => {
        const date = new Date(record.created_at).toISOString().split('T')[0];
        
        if (!dailyUsage[date]) {
          dailyUsage[date] = {
            date,
            total_tokens_used: 0,
            unique_users: 0,
            feature_breakdown: {}
          };
        }

        dailyUsage[date].total_tokens_used += record.tokens_used;
        
        if (!dailyUsage[date].feature_breakdown[record.feature_used]) {
          dailyUsage[date].feature_breakdown[record.feature_used] = 0;
        }
        dailyUsage[date].feature_breakdown[record.feature_used] += record.tokens_used;
      });

      const historyArray = Object.values(dailyUsage).sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setUsageHistory(historyArray.slice(0, 30)); // Últimos 30 dias

    } catch (err) {
      console.error('Erro ao buscar histórico de uso:', err);
    }
  }, []);

  const triggerMonthlyReset = useCallback(async () => {
    try {
      console.log('Executando reset mensal manual...');
      
      const { data, error } = await supabase.functions.invoke('monthly-token-reset');

      if (error) throw error;

      toast.success('Reset Mensal Executado!', {
        description: `Reset realizado com sucesso para ${data.stats?.usersAffected || 0} usuários.`,
        duration: 5000,
      });

      // Atualizar dados após reset
      await fetchTokenStats();

    } catch (err) {
      console.error('Erro no reset mensal:', err);
      toast.error('Erro no Reset', {
        description: 'Falha ao executar o reset mensal de tokens.',
        duration: 5000,
      });
    }
  }, [fetchTokenStats]);

  const exportTokenReport = useCallback(() => {
    if (!userDetails.length) return;

    const csvData = [
      ['Nome', 'Tokens Mensais', 'Tokens Extra', 'Total Disponível', 'Tokens Usados', 'Uso (%)', 'Data Reset'],
      ...userDetails.map(user => [
        user.full_name || 'Sem nome',
        user.monthly_tokens,
        user.extra_tokens,
        user.total_available,
        user.total_tokens_used,
        user.usage_percentage,
        user.tokens_reset_date
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `token-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    URL.revokeObjectURL(url);
    
    toast.success('Relatório Exportado!', {
      description: 'Relatório de tokens baixado com sucesso.',
    });
  }, [userDetails]);

  useEffect(() => {
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
