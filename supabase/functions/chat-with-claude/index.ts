
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, createSecureResponse, createErrorResponse, checkRateLimit, validateAuthToken, sanitizeInput } from '../_shared/security.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validar método HTTP
    if (req.method !== 'POST') {
      return createErrorResponse('Method not allowed', 405);
    }

    // Validar token de autenticação
    const authHeader = req.headers.get('Authorization');
    if (!validateAuthToken(authHeader)) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Obter dados da requisição
    const rawBody = await req.json();
    const body = sanitizeInput(rawBody);

    const { message, sessionId, agentId, userId, productId } = body;

    // Validar campos obrigatórios
    if (!message || !sessionId || !agentId || !userId) {
      return createErrorResponse('Missing required fields', 400);
    }

    // Rate limiting por usuário (20 requests por minuto)
    if (!checkRateLimit(`chat:${userId}`, 20, 60000)) {
      return createErrorResponse('Rate limit exceeded. Please try again later.', 429);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar tokens disponíveis usando a função segura
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('get_available_tokens', { p_user_id: userId });

    if (tokenError || !tokenData || tokenData.length === 0) {
      return createErrorResponse('Unable to verify token balance', 400);
    }

    const availableTokens = tokenData[0].total_available;
    if (availableTokens < 1000) { // Mínimo de tokens necessários
      return createErrorResponse('Insufficient tokens', 402);
    }

    // Buscar mensagens da sessão de forma segura
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(50); // Limitar histórico para segurança

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return createErrorResponse('Error fetching conversation history', 500);
    }

    // Buscar agente de forma segura
    const { data: agent, error: agentError } = await supabase
      .from('custom_agents')
      .select('prompt')
      .eq('id', agentId)
      .eq('user_id', userId) // Verificar propriedade
      .single();

    let systemPrompt = "Você é um assistente de IA especializado em copywriting e marketing.";
    
    if (!agentError && agent) {
      systemPrompt = agent.prompt;
    }

    // Preparar contexto do produto se fornecido
    let productContext = "";
    if (productId) {
      const { data: product } = await supabase
        .from('products')
        .select('name, niche, sub_niche')
        .eq('id', productId)
        .eq('user_id', userId) // Verificar propriedade
        .single();

      if (product) {
        productContext = `\n\nContexto do produto: ${product.name} (${product.niche}${product.sub_niche ? ` - ${product.sub_niche}` : ''})`;
      }
    }

    // Preparar mensagens para Claude com limite de segurança
    const conversationMessages = messages?.slice(-20) || []; // Máximo 20 mensagens
    const claudeMessages = conversationMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    claudeMessages.push({
      role: 'user',
      content: message
    });

    // Chamada segura para Claude
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        system: systemPrompt + productContext,
        messages: claudeMessages
      })
    });

    if (!claudeResponse.ok) {
      console.error('Claude API error:', await claudeResponse.text());
      return createErrorResponse('AI service temporarily unavailable', 503);
    }

    const claudeData = await claudeResponse.json();
    const aiResponse = claudeData.content[0].text;

    // Calcular tokens usados de forma mais precisa
    const promptTokens = JSON.stringify(claudeMessages).length / 4; // Aproximação
    const completionTokens = aiResponse.length / 4; // Aproximação
    const totalTokens = Math.ceil(promptTokens + completionTokens);

    // Consumir tokens usando função segura
    const { data: tokenConsumed, error: consumeError } = await supabase
      .rpc('consume_tokens', {
        p_user_id: userId,
        p_tokens_used: totalTokens,
        p_feature_used: 'chat',
        p_prompt_tokens: Math.ceil(promptTokens),
        p_completion_tokens: Math.ceil(completionTokens)
      });

    if (consumeError || !tokenConsumed) {
      console.error('Error consuming tokens:', consumeError);
      return createErrorResponse('Error processing request', 500);
    }

    // Salvar mensagem do usuário
    const { error: userMsgError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role: 'user',
        content: message,
        tokens_used: Math.ceil(promptTokens)
      });

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError);
    }

    // Salvar resposta da IA
    const { error: aiMsgError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role: 'assistant',
        content: aiResponse,
        tokens_used: Math.ceil(completionTokens)
      });

    if (aiMsgError) {
      console.error('Error saving AI message:', aiMsgError);
    }

    return createSecureResponse({
      message: aiResponse,
      tokensUsed: totalTokens
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse('Internal server error', 500);
  }
});
