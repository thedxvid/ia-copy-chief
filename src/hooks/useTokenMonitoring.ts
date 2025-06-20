
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
      console.log('📊 AUDITORIA: Iniciando busca de histórico de uso...');

      // Buscar registros dos últimos 30 dias com logs detalhados
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      console.log('📅 AUDITORIA: Buscando registros desde:', thirtyDaysAgo.toISOString());

      const { data: usage, error: usageError } = await supabase
        .from('token_usage')
        .select('created_at, tokens_used, feature_used, user_id, prompt_tokens, completion_tokens, total_tokens')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      console.log('📈 AUDITORIA: Histórico de uso encontrado:', {
        registros: usage?.length || 0, 
        error: usageError,
        ultimosRegistros: usage?.slice(0, 3).map(r => ({
          data: r.created_at,
          tokens: r.tokens_used,
          feature: r.feature_used,
          total: r.total_tokens
        }))
      });

      if (usageError) {
        console.error('❌ AUDITORIA: Erro ao buscar histórico:', usageError);
        throw usageError;
      }

      if (!usage || usage.length === 0) {
        console.log('⚠️ AUDITORIA: Nenhum histórico de uso encontrado nos últimos 30 dias');
        setUsageHistory([]);
        return;
      }

      // AUDITORIA: Verificar se há discrepâncias nos registros
      const inconsistentRecords = usage.filter(record => {
        const expectedTotal = (record.prompt_tokens || 0) + (record.completion_tokens || 0);
        const actualTotal = record.total_tokens || record.tokens_used;
        return Math.abs(expectedTotal - actualTotal) > 100; // Tolerância de 100 tokens
      });

      if (inconsistentRecords.length > 0) {
        console.warn('⚠️ AUDITORIA: Registros inconsistentes encontrados:', {
          quantidade: inconsistentRecords.length,
          exemplos: inconsistentRecords.slice(0, 2).map(r => ({
            id: r.user_id?.slice(0, 8),
            expected: (r.prompt_tokens || 0) + (r.completion_tokens || 0),
            actual: r.total_tokens || r.tokens_used,
            diferença: Math.abs(((r.prompt_tokens || 0) + (r.completion_tokens || 0)) - (r.total_tokens || r.tokens_used))
          }))
        });
      }

      // Agrupar por data usando UTC para consistência
      const dailyUsage: { [key: string]: TokenUsageHistory } = {};
      const uniqueUsers: { [key: string]: Set<string> } = {};

      usage.forEach((record, index) => {
        // Usar UTC para evitar problemas de timezone
        const date = new Date(record.created_at);
        const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
        const dateKey = utcDate.toISOString().split('T')[0];
        
        if (index < 5) { // Log apenas os primeiros 5 para debug
          console.log(`📅 AUDITORIA: Processando registro ${index + 1}:`, {
            originalDate: record.created_at,
            processedDate: dateKey,
            tokens: record.tokens_used,
            totalTokens: record.total_tokens,
            feature: record.feature_used,
            userId: record.user_id?.slice(0, 8)
          });
        }
        
        if (!dailyUsage[dateKey]) {
          dailyUsage[dateKey] = {
            date: dateKey,
            total_tokens_used: 0,
            unique_users: 0,
            feature_breakdown: {}
          };
          uniqueUsers[dateKey] = new Set();
        }

        // Usar o campo mais apropriado para tokens
        const tokensToAdd = record.total_tokens || record.tokens_used || 0;
        dailyUsage[dateKey].total_tokens_used += tokensToAdd;
        uniqueUsers[dateKey].add(record.user_id);
        
        const feature = record.feature_used || 'unknown';
        if (!dailyUsage[dateKey].feature_breakdown[feature]) {
          dailyUsage[dateKey].feature_breakdown[feature] = 0;
        }
        dailyUsage[dateKey].feature_breakdown[feature] += tokensToAdd;
      });

      // Atualizar contagem de usuários únicos
      Object.keys(dailyUsage).forEach(date => {
        dailyUsage[date].unique_users = uniqueUsers[date].size;
      });

      const historyArray = Object.values(dailyUsage).sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      console.log('📊 AUDITORIA: Histórico processado:', {
        diasProcessados: historyArray.length,
        totalTokensNoPeriodo: historyArray.reduce((sum, day) => sum + day.total_tokens_used, 0),
        diasComMaisUso: historyArray.slice(0, 3).map(day => ({
          data: day.date,
          tokens: day.total_tokens_used,
          usuarios: day.unique_users
        })),
        diasVazios: historyArray.filter(day => day.total_tokens_used === 0).length
      });

      // AUDITORIA: Verificar se há dias com muito pouco uso (possível perda de dados)
      const suspiciouslyLowDays = historyArray.filter(day => 
        day.total_tokens_used > 0 && day.total_tokens_used < 500
      );

      if (suspiciouslyLowDays.length > 0) {
        console.warn('⚠️ AUDITORIA: Dias com uso suspeitosamente baixo:', {
          quantidade: suspiciouslyLowDays.length,
          exemplos: suspiciouslyLowDays.slice(0, 3).map(day => ({
            data: day.date,
            tokens: day.total_tokens_used,
            usuarios: day.unique_users
          }))
        });
      }

      setUsageHistory(historyArray.slice(0, 30));

      // Toast de sucesso com informações de auditoria
      const auditInfo = inconsistentRecords.length > 0 ? 
        ` • ${inconsistentRecords.length} inconsistências detectadas` : 
        ' • Dados consistentes';

      toast.success('📊 Histórico atualizado!', {
        description: `${historyArray.length} dias processados${auditInfo}`,
        duration: 5000,
      });

    } catch (err) {
      console.error('❌ AUDITORIA: Erro ao buscar histórico de uso:', err);
      toast.error('Erro ao carregar histórico', {
        description: 'Falha ao buscar dados de uso de tokens',
        duration: 5000,
      });
    }
  }, []);

  // Configurar subscriptions em tempo real com melhor detecção
  useEffect(() => {
    console.log('🔄 AUDITORIA: Configurando subscriptions do dashboard de monitoramento...');

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
          console.log('🔄 AUDITORIA: Perfil atualizado (monitoramento):', {
            userId: payload.new?.id?.slice(0, 8),
            oldTokens: payload.old?.total_tokens_used,
            newTokens: payload.new?.total_tokens_used,
            difference: (payload.new?.total_tokens_used || 0) - (payload.old?.total_tokens_used || 0)
          });
          
          // Verificar se os campos de token foram alterados
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          
          const tokenFieldsChanged = 
            newRecord.monthly_tokens !== oldRecord.monthly_tokens ||
            newRecord.extra_tokens !== oldRecord.extra_tokens ||
            newRecord.total_tokens_used !== oldRecord.total_tokens_used;

          if (tokenFieldsChanged) {
            console.log('💰 AUDITORIA: Tokens de usuário alterados, recarregando estatísticas...');
            fetchTokenStats();
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 AUDITORIA: Status da subscription de profiles (monitoramento):', status);
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
          console.log('🔄 AUDITORIA: Novo uso de token registrado:', {
            userId: payload.new?.user_id?.slice(0, 8),
            tokens: payload.new?.tokens_used || payload.new?.total_tokens,
            feature: payload.new?.feature_used,
            timestamp: payload.new?.created_at
          });
          
          // Recarregar estatísticas e histórico imediatamente
          fetchTokenStats();
          fetchUsageHistory();
          
          toast.info('📊 AUDITORIA: Dados atualizados', {
            description: `Novo uso detectado: ${payload.new?.tokens_used || payload.new?.total_tokens || 0} tokens`,
            duration: 3000,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'token_usage',
        },
        (payload) => {
          console.log('🔄 AUDITORIA: Registro de uso atualizado:', {
            userId: payload.new?.user_id?.slice(0, 8),
            oldTokens: payload.old?.tokens_used || payload.old?.total_tokens,
            newTokens: payload.new?.tokens_used || payload.new?.total_tokens,
            feature: payload.new?.feature_used
          });
          
          // Recarregar dados quando um registro é atualizado
          fetchTokenStats();
          fetchUsageHistory();
        }
      )
      .subscribe((status) => {
        console.log('📡 AUDITORIA: Status da subscription de token usage:', status);
      });

    return () => {
      console.log('🧹 AUDITORIA: Limpando subscriptions do monitoramento');
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
    console.log('🔄 AUDITORIA: Refresh manual iniciado...');
    toast.info('🔍 Auditando sistema...', {
      description: 'Carregando dados mais recentes e verificando consistência',
      duration: 2000,
    });
    
    await Promise.all([
      fetchTokenStats(),
      fetchUsageHistory()
    ]);
  }, [fetchTokenStats, fetchUsageHistory]);

  useEffect(() => {
    console.log('🚀 AUDITORIA: Iniciando carregamento do dashboard de monitoramento...');
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
