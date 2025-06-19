
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, createSecureResponse, createErrorResponse, checkRateLimit, validateAuthToken, sanitizeInput } from '../_shared/security.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!

// Função para retry com backoff exponencial otimizado
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 4, // Aumentado para 4 tentativas
  baseDelay: number = 2000, // Delay inicial maior
  operation: string = 'operação'
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`🔄 Tentativa ${attempt + 1}/${maxRetries + 1} para ${operation}`);
      }
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Tentativa ${attempt + 1} falhou para ${operation}:`, {
        error: error.message,
        type: error.name,
        attempt: attempt + 1,
        maxRetries: maxRetries + 1,
        isTimeout: error.message?.includes('timeout') || error.name === 'AbortError'
      });
      
      if (attempt === maxRetries) {
        console.error(`💥 Todas as ${maxRetries + 1} tentativas falharam para ${operation}`);
        throw lastError;
      }
      
      // Backoff exponencial com jitter mais agressivo para timeouts
      const isTimeout = error.message?.includes('timeout') || error.name === 'AbortError';
      const jitter = Math.random() * 0.3; // 30% de variação aleatória
      const multiplier = isTimeout ? 1.5 : 2; // Delay menor para timeouts
      const delay = baseDelay * Math.pow(multiplier, attempt) * (1 + jitter);
      
      console.log(`⏳ Aguardando ${Math.round(delay)}ms antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Função otimizada para chamar Claude com timeouts aprimorados
async function callClaudeAPI(systemPrompt: string, messages: any[], attempt: number = 1) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000); // Aumentado para 90s
  
  try {
    console.log(`🚀 Iniciando chamada para Claude API (tentativa ${attempt})...`, {
      messageCount: messages.length,
      systemPromptLength: systemPrompt.length,
      timeout: '90s',
      timestamp: new Date().toISOString(),
      totalTokensEstimate: Math.ceil((systemPrompt.length + JSON.stringify(messages).length) / 4)
    });

    const startTime = Date.now();

    // Otimizar payload - remover campos desnecessários e limitar tamanho
    const optimizedMessages = messages.map(msg => ({
      role: msg.role,
      content: typeof msg.content === 'string' && msg.content.length > 4000 
        ? msg.content.substring(0, 4000) + '...' 
        : msg.content
    }));

    const payload = {
      model: 'claude-sonnet-4-20250514', // Mantendo Claude 4 como solicitado
      max_tokens: 2000,
      system: systemPrompt.length > 8000 ? systemPrompt.substring(0, 8000) + '...' : systemPrompt,
      messages: optimizedMessages,
      temperature: 0.7 // Adicionar temperatura para melhor performance
    };

    console.log(`📤 Payload otimizado:`, {
      systemPromptFinal: payload.system.length,
      messagesCount: payload.messages.length,
      estimatedTokens: Math.ceil(JSON.stringify(payload).length / 4)
    });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const responseTime = Date.now() - startTime;
    clearTimeout(timeoutId);
    
    console.log(`📥 Claude API respondeu:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      responseTime: `${responseTime}ms`,
      attempt,
      timestamp: new Date().toISOString()
    });

    // Tratamento mais robusto de erros HTTP
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Claude API Error ${response.status}: ${errorText}`;
      
      // Categorizar erros para melhor tratamento
      if (response.status === 429) {
        errorMessage = 'Rate limit atingido na API do Claude - aguardando...';
        throw new Error(errorMessage);
      } else if (response.status === 401) {
        errorMessage = 'Erro de autenticação na API do Claude';
        throw new Error(errorMessage);
      } else if (response.status === 500 || response.status === 502 || response.status === 503) {
        errorMessage = 'Erro interno na API do Claude - tentando novamente...';
        throw new Error(errorMessage);
      } else if (response.status === 413) {
        errorMessage = 'Payload muito grande para Claude API';
        throw new Error(errorMessage);
      }
      
      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    
    console.log(`✅ Claude API - Resposta processada com sucesso:`, {
      hasContent: !!responseData.content,
      contentLength: responseData.content?.[0]?.text?.length || 0,
      type: responseData.type,
      model: responseData.model,
      responseTime: `${responseTime}ms`,
      attempt,
      usage: responseData.usage || 'N/A'
    });

    return responseData;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Tratamento melhorado de diferentes tipos de erro
    if (error.name === 'AbortError') {
      throw new Error('Claude API timeout - A resposta está demorando mais que o esperado (90s)');
    }
    
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error('Erro de conectividade com a API do Claude');
    }

    if (error.message?.includes('Failed to fetch')) {
      throw new Error('Falha na conexão com Claude API - problema de rede');
    }
    
    throw error;
  }
}

serve(async (req) => {
  console.log('=== 🚀 INÍCIO DA FUNÇÃO CHAT-WITH-CLAUDE OTIMIZADA ===');
  console.log('Method:', req.method);
  console.log('Timestamp:', new Date().toISOString());
  console.log('URL:', req.url);

  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log('📋 Retornando resposta CORS OPTIONS');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validar método HTTP
    if (req.method !== 'POST') {
      console.error('❌ Método HTTP inválido:', req.method);
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
      console.error('❌ ANTHROPIC_API_KEY não encontrada nas variáveis de ambiente');
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

    console.log('🔑 ANTHROPIC_API_KEY configurada:', anthropicApiKey ? 'Sim' : 'Não');

    // Validar token de autenticação
    const authHeader = req.headers.get('Authorization');
    console.log('🔐 Auth header presente:', !!authHeader);
    
    if (!validateAuthToken(authHeader)) {
      console.error('❌ Token de autenticação inválido');
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
      console.log('📦 Body recebido com sucesso, campos:', Object.keys(rawBody));
    } catch (error) {
      console.error('❌ Erro ao parsear JSON:', error);
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
      console.error('❌ Campos obrigatórios ausentes:', { 
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

    console.log('✅ Dados validados:', {
      userId,
      messageLength: message.length,
      agentName,
      productId,
      hasHistory: Array.isArray(chatHistory) && chatHistory.length > 0,
      systemPromptLength: agentPrompt?.length || 0
    });

    // Rate limiting por usuário otimizado (30 requests por minuto)
    if (!checkRateLimit(`chat:${userId}`, 30, 60000)) {
      console.error('⏱️ Rate limit excedido para usuário:', userId);
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

    // Preparar prompt do sistema otimizado
    let systemPrompt = agentPrompt || "Você é um assistente de IA especializado em copywriting e marketing.";
    console.log('📝 System prompt preparado:', {
      length: systemPrompt.length,
      isCustomAgent,
      agentName,
      truncated: systemPrompt.length > 8000
    });
    
    // Preparar mensagens para Claude (limitando histórico de forma mais inteligente)
    const conversationMessages = Array.isArray(chatHistory) ? chatHistory.slice(-10) : []; // Reduzido para 10
    const claudeMessages = conversationMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content || ''
    }));

    claudeMessages.push({
      role: 'user',
      content: message
    });

    console.log('💬 Mensagens preparadas para Claude:', {
      totalMessages: claudeMessages.length,
      historyMessages: conversationMessages.length,
      lastMessageLength: claudeMessages[claudeMessages.length - 1]?.content?.length,
      totalTokensEstimate: Math.ceil(JSON.stringify(claudeMessages).length / 4)
    });

    // Chamada para Claude com retry otimizado
    let claudeData;
    try {
      console.log('🚀 Iniciando chamada para Claude com retry super otimizado...');
      
      claudeData = await retryWithBackoff(async () => {
        return await callClaudeAPI(systemPrompt, claudeMessages);
      }, 4, 2000, 'Claude API call'); // 4 tentativas, delay inicial de 2s
      
      console.log('🎉 Claude respondeu com sucesso:', {
        hasContent: !!claudeData.content,
        contentLength: claudeData.content?.[0]?.text?.length || 0,
        type: claudeData.type,
        model: claudeData.model,
        totalAttempts: 'success'
      });
      
    } catch (error) {
      console.error('💥 Erro final na chamada para Claude após retries otimizados:', {
        error: error.message,
        type: error.name,
        stack: error.stack?.split('\n')[0] // Apenas primeira linha do stack
      });
      
      // Categorização super otimizada de erros para o usuário
      let errorMessage = 'Erro temporário na IA. Tente novamente em alguns instantes.';
      let errorDetails = error.message;
      let retryable = true;
      
      if (error.message.includes('timeout') || error.message.includes('Claude API timeout')) {
        errorMessage = 'A IA está sobrecarregada no momento. Tente uma pergunta mais direta ou aguarde 30 segundos.';
        errorDetails = 'Timeout na API do Claude após múltiplas tentativas otimizadas (90s cada)';
        retryable = true;
      } else if (error.message.includes('Rate limit atingido')) {
        errorMessage = 'Muitas requisições simultâneas. Aguarde 10 segundos e tente novamente.';
        retryable = true;
      } else if (error.message.includes('credit balance') || error.message.includes('quota')) {
        errorMessage = 'Limite de uso da IA atingido temporariamente. Tente novamente em alguns minutos.';
        retryable = true;
      } else if (error.message.includes('401') || error.message.includes('autenticação')) {
        errorMessage = 'Erro de configuração da IA. Entre em contato com o suporte.';
        retryable = false;
      } else if (error.message.includes('503') || error.message.includes('indisponível') || error.message.includes('502')) {
        errorMessage = 'Serviço da IA temporariamente indisponível. Tente novamente em 1 minuto.';
        retryable = true;
      } else if (error.message.includes('network') || error.message.includes('conectividade') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Problema de conectividade. Verifique sua conexão e tente novamente.';
        retryable = true;
      } else if (error.message.includes('Payload muito grande')) {
        errorMessage = 'Mensagem muito longa. Tente ser mais conciso ou divida em partes menores.';
        retryable = false;
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
      console.error('❌ Erro na resposta do Claude:', claudeData.error);
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
      console.error('❌ Resposta do Claude sem conteúdo válido:', {
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
      console.error('❌ Texto da resposta inválido:', {
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

    console.log('🎯 Processamento concluído com sucesso otimizado:', {
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
    console.error('💥 ERRO CRÍTICO NA FUNÇÃO OTIMIZADA');
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3), // Primeiras 3 linhas do stack
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: 'Erro interno otimizado do servidor. Tente novamente em alguns momentos.',
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
