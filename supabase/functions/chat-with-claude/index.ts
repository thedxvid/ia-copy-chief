
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, createSecureResponse, createErrorResponse, checkRateLimit, validateAuthToken, sanitizeInput } from '../_shared/security.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!

// Função para retry com backoff exponencial melhorado
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3, // Aumentado de 1 para 3
  baseDelay: number = 1000,
  operation: string = 'operação'
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Tentativa ${attempt + 1}/${maxRetries + 1} para ${operation}`);
      }
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.error(`Tentativa ${attempt + 1} falhou para ${operation}:`, {
        error: error.message,
        type: error.name,
        attempt: attempt + 1,
        maxRetries: maxRetries + 1
      });
      
      if (attempt === maxRetries) {
        console.error(`Todas as ${maxRetries + 1} tentativas falharam para ${operation}`);
        throw lastError;
      }
      
      // Backoff exponencial com jitter para evitar thundering herd
      const jitter = Math.random() * 0.1; // 10% de variação aleatória
      const delay = baseDelay * Math.pow(2, attempt) * (1 + jitter);
      console.log(`Aguardando ${Math.round(delay)}ms antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Função otimizada para chamar Claude com timeouts melhorados
async function callClaudeAPI(systemPrompt: string, messages: any[], attempt: number = 1) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // Aumentado de 30s para 60s
  
  try {
    console.log(`Iniciando chamada para Claude API (tentativa ${attempt})...`, {
      messageCount: messages.length,
      systemPromptLength: systemPrompt.length,
      timeout: '60s', // Atualizado
      timestamp: new Date().toISOString()
    });

    const startTime = Date.now();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', // Mantendo Claude 4 como solicitado
        max_tokens: 2000,
        system: systemPrompt,
        messages: messages
      }),
      signal: controller.signal
    });

    const responseTime = Date.now() - startTime;
    clearTimeout(timeoutId);
    
    console.log('Claude API respondeu:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      responseTime: `${responseTime}ms`,
      attempt,
      timestamp: new Date().toISOString()
    });

    // Tratamento mais específico de erros HTTP
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Claude API Error ${response.status}: ${errorText}`;
      
      // Categorizar erros para melhor tratamento
      if (response.status === 429) {
        errorMessage = 'Rate limit atingido na API do Claude';
      } else if (response.status === 401) {
        errorMessage = 'Erro de autenticação na API do Claude';
      } else if (response.status === 500) {
        errorMessage = 'Erro interno na API do Claude';
      } else if (response.status === 503) {
        errorMessage = 'API do Claude temporariamente indisponível';
      }
      
      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    
    console.log('Claude API - Resposta processada com sucesso:', {
      hasContent: !!responseData.content,
      contentLength: responseData.content?.[0]?.text?.length || 0,
      type: responseData.type,
      model: responseData.model,
      responseTime: `${responseTime}ms`,
      attempt
    });

    return responseData;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Tratamento melhorado de diferentes tipos de erro
    if (error.name === 'AbortError') {
      throw new Error('Claude API timeout - A resposta está demorando mais que o esperado (60s)');
    }
    
    if (error.message.includes('network') || error.message.includes('fetch')) {
      throw new Error('Erro de conectividade com a API do Claude');
    }
    
    throw error;
  }
}

serve(async (req) => {
  console.log('=== INÍCIO DA FUNÇÃO CHAT-WITH-CLAUDE ===');
  console.log('Method:', req.method);
  console.log('Timestamp:', new Date().toISOString());
  console.log('URL:', req.url);

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
        JSON.stringify({ 
          error: 'Method not allowed',
          details: 'Apenas POST é permitido'
        }),
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
          details: 'ANTHROPIC_API_KEY missing',
          retryable: false
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
        JSON.stringify({ 
          error: 'Unauthorized',
          details: 'Token de autenticação inválido ou ausente'
        }),
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
          details: error.message,
          retryable: false
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
          details: 'message and userId are required',
          retryable: false
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
      hasHistory: Array.isArray(chatHistory) && chatHistory.length > 0,
      systemPromptLength: agentPrompt?.length || 0
    });

    // Rate limiting por usuário melhorado (25 requests por minuto)
    if (!checkRateLimit(`chat:${userId}`, 25, 60000)) {
      console.error('Rate limit excedido para usuário:', userId);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded', 
          details: 'Muitas requisições. Aguarde um momento antes de tentar novamente.',
          retryAfter: 60,
          retryable: true
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
    
    // Preparar mensagens para Claude (limitando histórico para melhor performance)
    const conversationMessages = Array.isArray(chatHistory) ? chatHistory.slice(-15) : [];
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
      lastMessageLength: claudeMessages[claudeMessages.length - 1]?.content?.length,
      totalTokensEstimate: JSON.stringify(claudeMessages).length / 4
    });

    // Chamada para Claude com retry melhorado
    let claudeData;
    try {
      console.log('🚀 Iniciando chamada para Claude com retry otimizado...');
      
      claudeData = await retryWithBackoff(async () => {
        return await callClaudeAPI(systemPrompt, claudeMessages);
      }, 3, 1500, 'Claude API call'); // 3 tentativas, delay inicial de 1.5s
      
      console.log('✅ Claude respondeu com sucesso:', {
        hasContent: !!claudeData.content,
        contentLength: claudeData.content?.[0]?.text?.length || 0,
        type: claudeData.type,
        model: claudeData.model,
        totalAttempts: 'success'
      });
      
    } catch (error) {
      console.error('❌ Erro final na chamada para Claude após retries:', {
        error: error.message,
        type: error.name,
        stack: error.stack?.split('\n')[0] // Apenas primeira linha do stack
      });
      
      // Categorização melhorada de erros para o usuário
      let errorMessage = 'Erro temporário na IA. Tente novamente em alguns momentos.';
      let errorDetails = error.message;
      let retryable = true;
      
      if (error.message.includes('timeout') || error.message.includes('Claude API timeout')) {
        errorMessage = 'A IA está demorando para responder. Tente uma pergunta mais simples ou aguarde um momento.';
        errorDetails = 'Timeout na API do Claude após múltiplas tentativas (60s cada)';
        retryable = true;
      } else if (error.message.includes('Rate limit atingido')) {
        errorMessage = 'Muitas requisições simultâneas na API. Aguarde alguns segundos.';
        retryable = true;
      } else if (error.message.includes('credit balance') || error.message.includes('quota')) {
        errorMessage = 'Limite de uso da IA atingido. Tente novamente mais tarde.';
        retryable = false;
      } else if (error.message.includes('401') || error.message.includes('autenticação')) {
        errorMessage = 'Erro de configuração da IA. Entre em contato com o suporte.';
        retryable = false;
      } else if (error.message.includes('503') || error.message.includes('indisponível')) {
        errorMessage = 'Serviço da IA temporariamente indisponível. Tente novamente em alguns minutos.';
        retryable = true;
      } else if (error.message.includes('network') || error.message.includes('conectividade')) {
        errorMessage = 'Problema de conectividade. Verifique sua conexão e tente novamente.';
        retryable = true;
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: errorDetails,
          retryable,
          timestamp: new Date().toISOString()
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
          details: claudeData.error.message || 'Unknown AI error',
          retryable: true
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!claudeData.content || !Array.isArray(claudeData.content) || claudeData.content.length === 0) {
      console.error('Resposta do Claude sem conteúdo válido:', {
        hasContent: !!claudeData.content,
        isArray: Array.isArray(claudeData.content),
        length: claudeData.content?.length
      });
      return new Response(
        JSON.stringify({ 
          error: 'Empty response from AI service',
          details: 'No content returned from Claude',
          retryable: true
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const aiResponse = claudeData.content[0]?.text;
    if (!aiResponse || typeof aiResponse !== 'string') {
      console.error('Texto da resposta inválido:', {
        hasText: !!claudeData.content[0]?.text,
        type: typeof claudeData.content[0]?.text,
        content: claudeData.content[0]
      });
      return new Response(
        JSON.stringify({ 
          error: 'Invalid response format from AI service',
          details: 'Response text is missing or invalid',
          retryable: true
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Calcular tokens usados (aproximação melhorada)
    const promptTokens = Math.ceil((systemPrompt.length + JSON.stringify(claudeMessages).length) / 4);
    const completionTokens = Math.ceil(aiResponse.length / 4);
    const totalTokens = promptTokens + completionTokens;

    console.log('✅ Processamento concluído com sucesso:', {
      userId,
      tokensUsed: totalTokens,
      promptTokens,
      completionTokens,
      responseLength: aiResponse.length,
      processingTime: Date.now(),
      model: 'claude-sonnet-4-20250514'
    });

    return new Response(
      JSON.stringify({
        response: aiResponse,
        tokensUsed: totalTokens,
        model: 'claude-sonnet-4-20250514',
        processingTime: Date.now()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('=== ERRO CRÍTICO NA FUNÇÃO ===');
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3), // Primeiras 3 linhas do stack
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: 'Erro interno do servidor. Tente novamente em alguns momentos.',
        timestamp: new Date().toISOString(),
        retryable: true
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
