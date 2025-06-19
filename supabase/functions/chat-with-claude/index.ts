
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, createSecureResponse, createErrorResponse, checkRateLimit, validateAuthToken, sanitizeInput } from '../_shared/security.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!

serve(async (req) => {
  console.log('=== INÍCIO DA FUNÇÃO CHAT-WITH-CLAUDE ===');
  console.log('Method:', req.method);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));

  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log('Retornando resposta CORS OPTIONS');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validar método HTTP
    if (req.method !== 'POST') {
      console.error('Método HTTP inválido:', req.method);
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 200, // Sempre retornar 200
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verificar se API key existe
    if (!anthropicApiKey) {
      console.error('ANTHROPIC_API_KEY não encontrada nas variáveis de ambiente');
      return new Response(
        JSON.stringify({ 
          error: 'AI service not configured', 
          details: 'ANTHROPIC_API_KEY missing' 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('ANTHROPIC_API_KEY encontrada:', anthropicApiKey ? 'Sim' : 'Não');

    // Validar token de autenticação
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header presente:', !!authHeader);
    
    if (!validateAuthToken(authHeader)) {
      console.error('Token de autenticação inválido');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Obter dados da requisição
    let rawBody;
    try {
      rawBody = await req.json();
      console.log('Body recebido:', JSON.stringify(rawBody, null, 2));
    } catch (error) {
      console.error('Erro ao parsear JSON:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: error.message 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const body = sanitizeInput(rawBody);
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
      console.error('Campos obrigatórios ausentes:', { 
        message: !!message, 
        userId: !!userId 
      });
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields', 
          details: 'message and userId are required' 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Dados validados:', {
      userId,
      messageLength: message.length,
      agentName,
      productId
    });

    // Rate limiting por usuário (20 requests por minuto)
    if (!checkRateLimit(`chat:${userId}`, 20, 60000)) {
      console.error('Rate limit excedido para usuário:', userId);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded', 
          details: 'Please try again later' 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Preparar prompt do sistema
    let systemPrompt = agentPrompt || "Você é um assistente de IA especializado em copywriting e marketing.";
    console.log('System prompt length:', systemPrompt.length);
    
    // Preparar mensagens para Claude
    const conversationMessages = Array.isArray(chatHistory) ? chatHistory.slice(-20) : [];
    const claudeMessages = conversationMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content || ''
    }));

    claudeMessages.push({
      role: 'user',
      content: message
    });

    console.log('Preparando chamada para Claude:', {
      systemPromptLength: systemPrompt.length,
      messageCount: claudeMessages.length,
      lastMessageLength: claudeMessages[claudeMessages.length - 1]?.content?.length
    });

    // Chamada para Claude com timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

    let claudeResponse;
    try {
      claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-4-20241022', // Claude 4 Sonnet mais recente
          max_tokens: 4000,
          system: systemPrompt,
          messages: claudeMessages
        }),
        signal: controller.signal
      });
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Erro na requisição para Claude:', error);
      
      if (error.name === 'AbortError') {
        return new Response(
          JSON.stringify({ 
            error: 'Request timeout', 
            details: 'Claude API request timed out' 
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Network error', 
          details: error.message 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    clearTimeout(timeoutId);

    console.log('Resposta Claude recebida:', {
      status: claudeResponse.status,
      statusText: claudeResponse.statusText,
      ok: claudeResponse.ok
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Erro da API Claude:', {
        status: claudeResponse.status,
        statusText: claudeResponse.statusText,
        body: errorText
      });
      
      // Retornar erro específico mas com status 200
      let errorMessage = 'AI service temporarily unavailable';
      if (claudeResponse.status === 401) {
        errorMessage = 'AI service authentication failed';
      } else if (claudeResponse.status === 429) {
        errorMessage = 'AI service rate limit exceeded';
      } else if (claudeResponse.status === 400) {
        errorMessage = 'Invalid request to AI service';
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: `Claude API returned ${claudeResponse.status}: ${errorText}`
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let claudeData;
    try {
      claudeData = await claudeResponse.json();
      console.log('Claude response parsed:', {
        hasContent: !!claudeData.content,
        contentLength: claudeData.content?.[0]?.text?.length || 0
      });
    } catch (error) {
      console.error('Erro ao parsear resposta do Claude:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid response from AI service',
          details: error.message
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const aiResponse = claudeData.content?.[0]?.text || 'Resposta não disponível';

    // Calcular tokens usados (aproximação)
    const promptTokens = JSON.stringify(claudeMessages).length / 4;
    const completionTokens = aiResponse.length / 4;
    const totalTokens = Math.ceil(promptTokens + completionTokens);

    console.log('Processamento concluído com sucesso:', {
      userId,
      tokensUsed: totalTokens,
      responseLength: aiResponse.length
    });

    return new Response(
      JSON.stringify({
        response: aiResponse,
        tokensUsed: totalTokens
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('=== ERRO CRÍTICO NA FUNÇÃO ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        stack: error.stack
      }),
      { 
        status: 200, // SEMPRE 200 para evitar o erro no frontend
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
