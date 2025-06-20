
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Configuração de ambiente incompleta');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Iniciando reset mensal de tokens...');

    // Executar função de reset mensal
    const { data: resetResult, error: resetError } = await supabase
      .rpc('reset_monthly_tokens');

    if (resetError) {
      console.error('Erro no reset de tokens:', resetError);
      throw new Error('Falha no reset de tokens mensais');
    }

    // Buscar estatísticas pós-reset
    const { data: stats, error: statsError } = await supabase
      .from('profiles')
      .select(`
        id,
        monthly_tokens,
        extra_tokens,
        total_tokens_used,
        tokens_reset_date
      `);

    if (statsError) {
      console.warn('Erro ao buscar estatísticas:', statsError);
    }

    const totalUsers = stats?.length || 0;
    const totalTokensReset = totalUsers * 100000; // Atualizado para 100k tokens per user

    console.log(`Reset concluído para ${totalUsers} usuários`);
    console.log(`Total de tokens resetados: ${totalTokensReset.toLocaleString()}`);

    // Log do reset para auditoria
    const resetLog = {
      event: 'monthly_token_reset',
      timestamp: new Date().toISOString(),
      users_affected: totalUsers,
      tokens_reset: totalTokensReset,
      success: true
    };

    console.log('Reset Log:', JSON.stringify(resetLog, null, 2));

    return new Response(JSON.stringify({
      success: true,
      message: 'Reset mensal de tokens executado com sucesso',
      stats: {
        usersAffected: totalUsers,
        tokensReset: totalTokensReset,
        resetDate: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro no monthly-token-reset:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Erro interno do servidor',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
