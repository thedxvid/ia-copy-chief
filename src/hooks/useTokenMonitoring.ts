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

  const fetchUserEmails = async (userIds: string[]): Promise<Map<string, string>> => {
    console.log('🔍 EMAIL FETCH: Iniciando busca de emails para', userIds.length, 'usuários');
    
    // Método 1: Tentar edge function primeiro
    try {
      console.log('📧 MÉTODO 1: Tentando edge function get-user-emails...');
      
      const { data: emailsData, error: emailsError } = await supabase.functions.invoke('get-user-emails', {
        body: { user_ids: userIds }
      });

      console.log('📧 EDGE FUNCTION RESPONSE DETALHADA:', {
        data: emailsData,
        error: emailsError,
        dataType: typeof emailsData,
        isArray: Array.isArray(emailsData),
        dataLength: emailsData?.length,
        primeiros3: emailsData?.slice(0, 3)
      });

      if (emailsError) {
        console.error('❌ EDGE FUNCTION ERROR:', emailsError);
        throw emailsError;
      }

      if (emailsData && Array.isArray(emailsData) && emailsData.length > 0) {
        const emailMap = new Map<string, string>();
        emailsData.forEach((user: { id: string; email: string }) => {
          console.log('📧 PROCESSANDO USUÁRIO DA EDGE FUNCTION:', { 
            id: user.id?.slice(0, 8), 
            email: user.email,
            temEmail: !!user.email
          });
          if (user.email) {
            emailMap.set(user.id, user.email);
          }
        });
        console.log('✅ EDGE FUNCTION SUCESSO:', {
          emailsEncontrados: emailMap.size,
          totalUsuarios: userIds.length,
          percentual: ((emailMap.size / userIds.length) * 100).toFixed(1) + '%',
          primeirosEmails: Array.from(emailMap.entries()).slice(0, 3)
        });
        return emailMap;
      } else {
        console.warn('⚠️ EDGE FUNCTION: Dados vazios ou inválidos:', emailsData);
      }
    } catch (edgeFunctionError) {
      console.error('❌ EDGE FUNCTION FALHOU COMPLETAMENTE:', edgeFunctionError);
    }

    // Método 2: Fallback para RPC
    try {
      console.log('📧 MÉTODO 2: Tentando RPC fallback get_user_emails...');
      
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_user_emails', { user_ids: userIds });

      console.log('📧 RPC RESPONSE DETALHADA:', {
        data: rpcData,
        error: rpcError,
        dataType: typeof rpcData,
        isArray: Array.isArray(rpcData),
        dataLength: rpcData?.length,
        primeiros3: rpcData?.slice(0, 3)
      });

      if (rpcError) {
        console.error('❌ RPC ERROR:', rpcError);
        throw rpcError;
      }

      if (rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
        const emailMap = new Map<string, string>();
        rpcData.forEach((user: { id: string; email: string }) => {
          console.log('📧 PROCESSANDO USUÁRIO DO RPC:', { 
            id: user.id?.slice(0, 8), 
            email: user.email,
            temEmail: !!user.email
          });
          if (user.email) {
            emailMap.set(user.id, user.email);
          }
        });
        console.log('✅ RPC SUCESSO:', {
          emailsEncontrados: emailMap.size,
          totalUsuarios: userIds.length,
          percentual: ((emailMap.size / userIds.length) * 100).toFixed(1) + '%',
          primeirosEmails: Array.from(emailMap.entries()).slice(0, 3)
        });
        return emailMap;
      } else {
        console.warn('⚠️ RPC: Dados vazios ou inválidos:', rpcData);
      }
    } catch (rpcError) {
      console.error('❌ RPC FALHOU COMPLETAMENTE:', rpcError);
    }

    // Se tudo falhar, retornar mapa vazio mas com log detalhado
    console.error('❌ TODOS OS MÉTODOS FALHARAM - Retornando mapa vazio');
    console.log('🔍 DIAGNÓSTICO FINAL: Nenhum método conseguiu buscar emails');
    
    toast.error('Erro ao buscar emails', {
      description: 'Não foi possível carregar os emails dos usuários. Verifique as permissões.',
      duration: 5000,
    });

    return new Map<string, string>();
  };

  const fetchTokenStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 HOOK: Iniciando busca de estatísticas de créditos...');

      // Buscar TODOS os usuários da tabela profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📊 PROFILES DATA:', { 
        profiles: profilesData?.length || 0, 
        error: profilesError,
        firstProfile: profilesData?.[0]
      });

      if (profilesError) {
        console.error('❌ ERRO AO BUSCAR PROFILES:', profilesError);
        throw profilesError;
      }

      if (!profilesData || profilesData.length === 0) {
        console.log('⚠️ NENHUM PERFIL ENCONTRADO');
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

      console.log('👥 TOTAL DE PROFILES:', profilesData.length);

      // Buscar emails usando as funções disponíveis
      const userIds = profilesData.map(profile => profile.id);
      console.log('🔍 IDS DOS USUÁRIOS PARA BUSCAR EMAILS:', userIds.slice(0, 3), '...e mais', userIds.length - 3);
      
      const emailMap = await fetchUserEmails(userIds);
      
      console.log('📧 RESULTADO FINAL DO MAPEAMENTO DE EMAILS:', {
        totalEmails: emailMap.size,
        totalUsuarios: userIds.length,
        percentualSucesso: ((emailMap.size / userIds.length) * 100).toFixed(1) + '%',
        primeirosEmails: Array.from(emailMap.entries()).slice(0, 3)
      });

      // Processar usuários com emails
      const processedUsers: UserTokenData[] = [];
      
      for (const profile of profilesData) {
        try {
          // Usar a função RPC para obter dados corretos
          const { data: tokenData, error: tokenError } = await supabase
            .rpc('check_token_balance', { p_user_id: profile.id });

          // Buscar email do mapa
          const userEmail = emailMap.get(profile.id) || null;

          if (profile.id === profilesData[0].id) {
            console.log('📧 HOOK - TESTE PRIMEIRO USUÁRIO:', {
              id: profile.id.slice(0, 8),
              nome: profile.full_name,
              emailEncontrado: userEmail,
              estavaNoMapa: emailMap.has(profile.id)
            });
          }

          if (tokenError) {
            console.warn(`⚠️ RPC erro para usuário ${profile.id.slice(0, 8)}:`, tokenError);
            
            // Fallback para cálculo manual
            const totalAvailable = Math.max(0, 
              (profile.monthly_tokens || 0) + (profile.extra_tokens || 0) - (profile.total_tokens_used || 0)
            );
            
            const usagePercentage = (profile.monthly_tokens || 0) + (profile.extra_tokens || 0) > 0 
              ? Math.round(((profile.total_tokens_used || 0) / ((profile.monthly_tokens || 0) + (profile.extra_tokens || 0))) * 100)
              : 0;

            processedUsers.push({
              id: profile.id,
              full_name: profile.full_name,
              email: userEmail,
              monthly_tokens: profile.monthly_tokens || 0,
              extra_tokens: profile.extra_tokens || 0,
              total_tokens_used: profile.total_tokens_used || 0,
              tokens_reset_date: profile.tokens_reset_date || new Date().toISOString().split('T')[0],
              total_available: totalAvailable,
              usage_percentage: Math.max(0, Math.min(100, usagePercentage))
            });
          } else if (tokenData && tokenData.length > 0) {
            const data = tokenData[0];
            
            const totalAvailable = data.total_available;
            const totalPossible = data.monthly_tokens + data.extra_tokens;
            const usagePercentage = totalPossible > 0 
              ? Math.round((data.total_used / totalPossible) * 100)
              : 0;

            processedUsers.push({
              id: profile.id,
              full_name: profile.full_name,
              email: userEmail,
              monthly_tokens: data.monthly_tokens,
              extra_tokens: data.extra_tokens,
              total_tokens_used: data.total_used,
              tokens_reset_date: profile.tokens_reset_date || new Date().toISOString().split('T')[0],
              total_available: totalAvailable,
              usage_percentage: Math.max(0, Math.min(100, usagePercentage))
            });
          }
        } catch (userError) {
          console.warn(`⚠️ Erro ao processar usuário ${profile.id.slice(0, 8)}:`, userError);
          
          // Fallback com email do mapa
          const userEmail = emailMap.get(profile.id) || null;
          
          const totalAvailable = Math.max(0, 
            (profile.monthly_tokens || 0) + (profile.extra_tokens || 0) - (profile.total_tokens_used || 0)
          );
          
          const usagePercentage = (profile.monthly_tokens || 0) + (profile.extra_tokens || 0) > 0 
            ? Math.round(((profile.total_tokens_used || 0) / ((profile.monthly_tokens || 0) + (profile.extra_tokens || 0))) * 100)
            : 0;

          processedUsers.push({
            id: profile.id,
            full_name: profile.full_name,
            email: userEmail,
            monthly_tokens: profile.monthly_tokens || 0,
            extra_tokens: profile.extra_tokens || 0,
            total_tokens_used: profile.total_tokens_used || 0,
            tokens_reset_date: profile.tokens_reset_date || new Date().toISOString().split('T')[0],
            total_available: totalAvailable,
            usage_percentage: Math.max(0, Math.min(100, usagePercentage))
          });
        }
      }

      console.log('✅ HOOK - USUÁRIOS PROCESSADOS:', processedUsers.length);
      console.log('📧 HOOK - USUÁRIOS COM EMAIL:', processedUsers.filter(u => u.email).length);
      console.log('📧 HOOK - PRIMEIROS 3 USUÁRIOS PROCESSADOS:', processedUsers.slice(0, 3).map(u => ({
        name: u.full_name,
        email: u.email,
        id: u.id.slice(0, 8),
        hasEmail: !!u.email
      })));

      // Calcular estatísticas
      const totalUsers = processedUsers.length;
      const totalTokensUsed = processedUsers.reduce((sum, u) => sum + u.total_tokens_used, 0);
      const totalTokensAvailable = processedUsers.reduce((sum, u) => sum + u.total_available, 0);
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

      console.log('📈 HOOK - ESTATÍSTICAS CALCULADAS:', calculatedStats);

      // Definir os dados
      setStats(calculatedStats);
      setUserDetails(processedUsers.sort((a, b) => b.total_tokens_used - a.total_tokens_used));

      console.log('✅ HOOK - DADOS DEFINIDOS COM SUCESSO');
      console.log('🎯 HOOK - VERIFICAÇÃO FINAL USERDETAILS:', {
        length: processedUsers.length,
        comEmail: processedUsers.filter(u => u.email).length,
        primeiro: processedUsers[0] ? {
          name: processedUsers[0].full_name,
          email: processedUsers[0].email,
          hasEmail: !!processedUsers[0].email
        } : null
      });
      
      // Toast de sucesso com informações sobre emails
      const emailInfo = emailMap.size > 0 ? 
        ` • ${emailMap.size} emails carregados` : 
        ' • Emails não disponíveis';

      toast.success('📊 Dashboard atualizado!', {
        description: `${processedUsers.length} usuários processados${emailInfo}`,
        duration: 3000,
      });

    } catch (err) {
      console.error('❌ ERRO GERAL:', err);
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

      // Buscar registros dos últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: usage, error: usageError } = await supabase
        .from('token_usage')
        .select('created_at, tokens_used, feature_used, user_id, prompt_tokens, completion_tokens, total_tokens')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

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

      usage.forEach((record) => {
        const date = new Date(record.created_at);
        const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
        const dateKey = utcDate.toISOString().split('T')[0];
        
        if (!dailyUsage[dateKey]) {
          dailyUsage[dateKey] = {
            date: dateKey,
            total_tokens_used: 0,
            unique_users: 0,
            feature_breakdown: {}
          };
          uniqueUsers[dateKey] = new Set();
        }

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

      setUsageHistory(historyArray.slice(0, 30));

    } catch (err) {
      console.error('❌ AUDITORIA: Erro ao buscar histórico de uso:', err);
      toast.error('Erro ao carregar histórico', {
        description: 'Falha ao buscar dados de uso de tokens',
        duration: 5000,
      });
    }
  }, []);

  // Configurar subscriptions em tempo real com detecção melhorada para edições de token
  useEffect(() => {
    console.log('🔄 MONITORAMENTO: Configurando subscriptions do dashboard de monitoramento...');

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
          console.log('🔄 MONITORAMENTO: Perfil atualizado (monitoramento):', {
            userId: payload.new?.id?.slice(0, 8),
            oldMonthly: payload.old?.monthly_tokens,
            newMonthly: payload.new?.monthly_tokens,
            oldExtra: payload.old?.extra_tokens,
            newExtra: payload.new?.extra_tokens,
            oldUsed: payload.old?.total_tokens_used,
            newUsed: payload.new?.total_tokens_used
          });
          
          // Verificar se os campos de token foram alterados
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          
          const tokenFieldsChanged = 
            newRecord.monthly_tokens !== oldRecord.monthly_tokens ||
            newRecord.extra_tokens !== oldRecord.extra_tokens ||
            newRecord.total_tokens_used !== oldRecord.total_tokens_used;

          if (tokenFieldsChanged) {
            console.log('💰 MONITORAMENTO: Tokens de usuário alterados, recarregando estatísticas...');
            
            // Aguardar um pouco para garantir que a transação foi commitada
            setTimeout(() => {
              fetchTokenStats();
            }, 1000);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 MONITORAMENTO: Status da subscription de profiles:', status);
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
          console.log('🔄 MONITORAMENTO: Novo uso de token registrado:', {
            userId: payload.new?.user_id?.slice(0, 8),
            tokens: payload.new?.tokens_used || payload.new?.total_tokens,
            feature: payload.new?.feature_used,
            timestamp: payload.new?.created_at
          });
          
          // Recarregar estatísticas quando há novo uso
          setTimeout(() => {
            fetchTokenStats();
          }, 500);
        }
      )
      .subscribe((status) => {
        console.log('📡 MONITORAMENTO: Status da subscription de token usage:', status);
      });

    // Subscription para logs de auditoria de tokens (para detectar edições admin)
    const auditChannelName = `monitoring-audit-${timestamp}`;
    const auditChannel = supabase
      .channel(auditChannelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'token_audit_logs',
        },
        (payload) => {
          console.log('🔄 MONITORAMENTO: Nova edição de token detectada:', {
            userId: payload.new?.user_id?.slice(0, 8),
            adminId: payload.new?.admin_user_id?.slice(0, 8),
            action: payload.new?.action_type,
            oldValue: payload.new?.old_value,
            newValue: payload.new?.new_value,
            reason: payload.new?.reason
          });
          
          // Recarregar estatísticas imediatamente após edição admin
          setTimeout(() => {
            fetchTokenStats();
          }, 500);
          
          toast.info('📊 Tokens atualizados', {
            description: `Edição admin detectada: ${payload.new?.action_type}`,
            duration: 3000,
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 MONITORAMENTO: Status da subscription de audit logs:', status);
      });

    return () => {
      console.log('🧹 MONITORAMENTO: Limpando subscriptions do monitoramento');
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(usageChannel);
      supabase.removeChannel(auditChannel);
    };
  }, [fetchTokenStats]);

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
          user.email || 'Email não disponível',
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
    console.log('🔄 FORCE REFRESH INICIADO - Limpando cache e recarregando...');
    toast.info('🔍 Recarregando dados...', {
      description: 'Verificando emails e atualizando informações',
      duration: 2000,
    });
    
    await Promise.all([
      fetchTokenStats(),
      fetchUsageHistory()
    ]);
  }, [fetchTokenStats, fetchUsageHistory]);

  useEffect(() => {
    console.log('🚀 INICIANDO DASHBOARD DE MONITORAMENTO...');
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
