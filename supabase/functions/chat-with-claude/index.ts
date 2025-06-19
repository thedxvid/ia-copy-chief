
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

    console.log('Request body received:', JSON.stringify(body, null, 2));

    const { 
      message, 
      agentPrompt, 
      chatHistory, 
      agentName, 
      isCustomAgent, 
      customAgentId, 
      productId, 
      userId 
    } = body;

    // Validar campos obrigatórios
    if (!message || !userId) {
      console.error('Missing required fields:', { message: !!message, userId: !!userId });
      return createErrorResponse('Missing required fields: message and userId are required', 400);
    }

    // Rate limiting por usuário (20 requests por minuto)
    if (!checkRateLimit(`chat:${userId}`, 20, 60000)) {
      return createErrorResponse('Rate limit exceeded. Please try again later.', 429);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar se o Anthropic API key está configurado
    if (!anthropicApiKey) {
      console.error('ANTHROPIC_API_KEY not configured');
      return createErrorResponse('AI service not configured', 500);
    }

    // Preparar prompt do sistema
    let systemPrompt = agentPrompt || "Você é um assistente de IA especializado em copywriting e marketing.";
    
    // Preparar mensagens para Claude
    const conversationMessages = Array.isArray(chatHistory) ? chatHistory.slice(-20) : []; // Máximo 20 mensagens
    const claudeMessages = conversationMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content || ''
    }));

    claudeMessages.push({
      role: 'user',
      content: message
    });

    console.log('Calling Claude API with:', {
      systemPrompt: systemPrompt.substring(0, 100) + '...',
      messageCount: claudeMessages.length,
      lastMessage: claudeMessages[claudeMessages.length - 1]?.content?.substring(0, 100) + '...'
    });

    // Chamada para Claude
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
        system: systemPrompt,
        messages: claudeMessages
      })
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', {
        status: claudeResponse.status,
        statusText: claudeResponse.statusText,
        error: errorText
      });
      
      // Retornar erro mais específico baseado no status
      if (claudeResponse.status === 401) {
        return createErrorResponse('AI service authentication failed', 401);
      } else if (claudeResponse.status === 429) {
        return createErrorResponse('AI service rate limit exceeded. Please try again later.', 429);
      } else if (claudeResponse.status === 400) {
        return createErrorResponse('Invalid request to AI service', 400);
      } else {
        return createErrorResponse('AI service temporarily unavailable', 503);
      }
    }

    const claudeData = await claudeResponse.json();
    console.log('Claude response received:', {
      hasContent: !!claudeData.content,
      contentLength: claudeData.content?.[0]?.text?.length || 0
    });

    const aiResponse = claudeData.content?.[0]?.text || 'Resposta não disponível';

    // Calcular tokens usados (aproximação)
    const promptTokens = JSON.stringify(claudeMessages).length / 4;
    const completionTokens = aiResponse.length / 4;
    const totalTokens = Math.ceil(promptTokens + completionTokens);

    console.log('Request processed successfully:', {
      userId,
      tokensUsed: totalTokens,
      responseLength: aiResponse.length
    });

    return createSecureResponse({
      response: aiResponse,
      tokensUsed: totalTokens
    });

  } catch (error) {
    console.error('Unexpected error in chat function:', error);
    
    // Log detalhado para debugging
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return createErrorResponse('Internal server error', 500);
  }
});
