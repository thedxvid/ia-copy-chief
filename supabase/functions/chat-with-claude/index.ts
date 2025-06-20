
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
    const { message, sessionId, userId, agentId } = await req.json();
    
    if (!message || !sessionId || !userId || !agentId) {
      throw new Error('Dados obrigatórios não fornecidos');
    }

    console.log('💬 Nova mensagem do chat:', { sessionId, userId, agentId });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!supabaseUrl || !supabaseKey || !anthropicApiKey) {
      throw new Error('Variáveis de ambiente não configuradas');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Estimar tokens antes de usar
    const estimatedTokens = Math.ceil(message.length * 0.75) + 800; // Estimativa baseada no tamanho da mensagem
    console.log('📊 Tokens estimados:', estimatedTokens);

    // Verificar tokens disponíveis
    const { data: tokensData, error: tokensError } = await supabase
      .rpc('get_available_tokens', { p_user_id: userId });

    if (tokensError) {
      console.error('❌ Erro ao verificar tokens:', tokensError);
      throw new Error('Erro ao verificar tokens disponíveis');
    }

    const userTokens = tokensData?.[0];
    console.log('💰 Tokens do usuário:', userTokens);
    
    if (!userTokens || userTokens.total_available < estimatedTokens) {
      throw new Error(`Tokens insuficientes. Você tem ${userTokens?.total_available || 0} tokens disponíveis e precisa de aproximadamente ${estimatedTokens} tokens.`);
    }

    // Salvar mensagem do usuário
    await supabase.from('chat_messages').insert({
      session_id: sessionId,
      role: 'user',
      content: message,
      tokens_used: 0
    });

    // Buscar histórico de mensagens
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    console.log('📜 Histórico de mensagens:', messages?.length || 0);

    // Buscar dados do agente
    let agentData = null;
    const { data: customAgent } = await supabase
      .from('custom_agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (customAgent) {
      agentData = customAgent;
      console.log('🤖 Usando agente personalizado:', customAgent.name);
    } else {
      // Buscar agente padrão nos dados estáticos (você pode implementar esta lógica)
      console.log('🤖 Usando agente padrão:', agentId);
    }

    // Preparar mensagens para a API
    const apiMessages = messages?.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    })) || [];

    console.log('🚀 Chamando Claude API...');

    // Chamar API da Anthropic
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8000,
        messages: apiMessages,
        system: agentData?.prompt || "Você é um assistente especializado em copywriting e marketing digital. Seja útil, criativo e forneça respostas detalhadas e práticas."
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro da API Claude:', response.status, errorText);
      throw new Error(`Erro na API Claude: ${response.status}`);
    }

    const aiData = await response.json();
    
    if (!aiData.content || !Array.isArray(aiData.content) || aiData.content.length === 0) {
      console.error('❌ Resposta inválida da API:', aiData);
      throw new Error('Resposta inválida da API Claude');
    }

    const aiResponse = aiData.content[0]?.text;
    if (!aiResponse || typeof aiResponse !== 'string') {
      console.error('❌ Texto da resposta inválido:', aiData.content[0]);
      throw new Error('Texto da resposta inválido');
    }

    console.log('✅ Resposta gerada com sucesso, tamanho:', aiResponse.length);

    // Calcular tokens reais usados
    const actualTokensUsed = aiData.usage?.input_tokens + aiData.usage?.output_tokens || estimatedTokens;
    console.log('📊 Tokens reais usados:', actualTokensUsed, {
      input: aiData.usage?.input_tokens,
      output: aiData.usage?.output_tokens
    });

    // Consumir tokens
    const { data: consumeResult, error: consumeError } = await supabase
      .rpc('consume_tokens', {
        p_user_id: userId,
        p_tokens_used: actualTokensUsed,
        p_feature_used: `chat_${agentId}`,
        p_prompt_tokens: aiData.usage?.input_tokens || Math.floor(actualTokensUsed * 0.4),
        p_completion_tokens: aiData.usage?.output_tokens || Math.floor(actualTokensUsed * 0.6)
      });

    if (consumeError) {
      console.error('⚠️ Erro ao consumir tokens:', consumeError);
    } else {
      console.log('✅ Tokens consumidos com sucesso');
      
      // 🔔 BROADCAST DA MUDANÇA PARA ATUALIZAÇÃO EM TEMPO REAL
      try {
        await supabase
          .channel('token-updates')
          .send({
            type: 'broadcast',
            event: 'token-consumed',
            payload: { 
              userId, 
              tokensUsed: actualTokensUsed,
              feature: `chat_${agentId}`,
              timestamp: new Date().toISOString()
            }
          });
        console.log('📡 Broadcast enviado para atualização em tempo real');
      } catch (broadcastError) {
        console.error('⚠️ Erro no broadcast:', broadcastError);
      }
    }

    // Salvar resposta do assistente
    await supabase.from('chat_messages').insert({
      session_id: sessionId,
      role: 'assistant',
      content: aiResponse,
      tokens_used: actualTokensUsed,
      streaming_complete: true
    });

    console.log('🎉 Chat completado com sucesso');

    return new Response(JSON.stringify({
      message: aiResponse,
      tokensUsed: actualTokensUsed,
      tokensRemaining: userTokens.total_available - actualTokensUsed
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Erro no chat:', error);
    
    return new Response(JSON.stringify({
      error: error.message || 'Erro interno do servidor',
      details: error.name || 'Unknown error'
    }), {
      status: error.message.includes('Tokens insuficientes') ? 402 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
