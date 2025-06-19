import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, createSecureResponse, createErrorResponse, checkRateLimit, validateAuthToken, sanitizeInput } from '../_shared/security.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!

// Função para retry com backoff exponencial
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.error(`Tentativa ${attempt + 1} falhou:`, error.message);
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Backoff exponencial: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Aguardando ${delay}ms antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Função melhorada para chamar Claude
async function callClaudeAPI(systemPrompt: string, messages: any[]) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos
  
  try {
    console.log('Iniciando chamada para Claude API...', {
      messageCount: messages.length,
      systemPromptLength: systemPrompt.length,
      timeout: '60s'
    });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', // ATUALIZADO PARA CLAUDE 4 SONNET VÁLIDO
        max_tokens: 4000,
        system: systemPrompt,
        messages: messages
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    
    console.log('Claude API respondeu:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API Error ${response.status}: ${errorText}`);
    }

    return await response.json();
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Claude API timeout - A resposta está demorando mais que o esperado');
    }
    
    throw error;
  }
}

serve(async (req) => {
  console.log('=== INÍCIO DA FUNÇÃO CHAT-WITH-CLAUDE ===');
  console.log('Method:', req.method);
  console.log('Timestamp:', new Date().toISOString());

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
          status: 200,
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

    console.log('ANTHROPIC_API_KEY configurada:', anthropicApiKey ? 'Sim' : 'Não');

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
      console.log('Body recebido com sucesso, campos:', Object.keys(rawBody));
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
      productId,
      hasHistory: Array.isArray(chatHistory) && chatHistory.length > 0
    });

    // Rate limiting por usuário (20 requests por minuto)
    if (!checkRateLimit(`chat:${userId}`, 20, 60000)) {
      console.error('Rate limit excedido para usuário:', userId);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded', 
          details: 'Muitas requisições. Aguarde um momento antes de tentar novamente.' 
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
    console.log('System prompt preparado:', {
      length: systemPrompt.length,
      isCustomAgent,
      agentName
    });
    
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

    console.log('Mensagens preparadas para Claude:', {
      totalMessages: claudeMessages.length,
      historyMessages: conversationMessages.length,
      lastMessageLength: claudeMessages[claudeMessages.length - 1]?.content?.length
    });

    // Chamada para Claude com retry
    let claudeData;
    try {
      console.log('🚀 Iniciando chamada para Claude com retry...');
      
      claudeData = await retryWithBackoff(async () => {
        return await callClaudeAPI(systemPrompt, claudeMessages);
      }, 2, 2000); // 2 tentativas, delay inicial de 2s
      
      console.log('✅ Claude respondeu com sucesso:', {
        hasContent: !!claudeData.content,
        contentLength: claudeData.content?.[0]?.text?.length || 0,
        type: claudeData.type,
        model: claudeData.model
      });
      
    } catch (error) {
      console.error('❌ Erro final na chamada para Claude após retries:', error);
      
      let errorMessage = 'Erro temporário na IA. Tente novamente.';
      let errorDetails = error.message;
      
      if (error.message.includes('timeout') || error.message.includes('Claude API timeout')) {
        errorMessage = 'A IA está demorando para responder. Tente uma pergunta mais simples ou aguarde um momento.';
        errorDetails = 'Timeout na API do Claude após múltiplas tentativas';
      } else if (error.message.includes('credit balance') || error.message.includes('quota')) {
        errorMessage = 'Limite de uso da IA atingido. Tente novamente mais tarde.';
      } else if (error.message.includes('401')) {
        errorMessage = 'Erro de configuração da IA. Entre em contato com o suporte.';
      } else if (error.message.includes('429')) {
        errorMessage = 'Muitas requisições simultâneas. Aguarde um momento.';
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: errorDetails,
          retryable: !error.message.includes('401')
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validação robusta da resposta do Claude
    if (claudeData.error) {
      console.error('Erro na resposta do Claude:', claudeData.error);
      return new Response(
        JSON.stringify({ 
          error: 'AI service error',
          details: claudeData.error.message || 'Unknown AI error'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!claudeData.content || !Array.isArray(claudeData.content) || claudeData.content.length === 0) {
      console.error('Resposta do Claude sem conteúdo válido:', claudeData);
      return new Response(
        JSON.stringify({ 
          error: 'Empty response from AI service',
          details: 'No content returned from Claude'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const aiResponse = claudeData.content[0]?.text;
    if (!aiResponse || typeof aiResponse !== 'string') {
      console.error('Texto da resposta inválido:', claudeData.content[0]);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid response format from AI service',
          details: 'Response text is missing or invalid'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Calcular tokens usados (aproximação)
    const promptTokens = JSON.stringify(claudeMessages).length / 4;
    const completionTokens = aiResponse.length / 4;
    const totalTokens = Math.ceil(promptTokens + completionTokens);

    console.log('✅ Processamento concluído com sucesso:', {
      userId,
      tokensUsed: totalTokens,
      responseLength: aiResponse.length,
      processingTime: Date.now()
    });

    return new Response(
      JSON.stringify({
        response: aiResponse,
        tokensUsed: totalTokens,
        model: 'claude-sonnet-4-20250514'
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
    console.error('Timestamp:', new Date().toISOString());
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: 'Erro interno do servidor. Tente novamente.',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
