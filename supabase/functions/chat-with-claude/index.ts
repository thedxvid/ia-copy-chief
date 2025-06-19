
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, createSecureResponse, createErrorResponse, checkRateLimit, validateAuthToken, sanitizeInput } from '../_shared/security.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!

// Modelos Claude disponíveis em ordem de preferência
const CLAUDE_MODELS = [
  'claude-3-5-sonnet-20241022', // Claude Sonnet 4 mais recente
  'claude-3-5-sonnet-20240620', // Fallback
  'claude-3-sonnet-20240229'    // Fallback final
];

const MAX_RETRIES = 2;
const REQUEST_TIMEOUT = 45000; // 45 segundos

serve(async (req) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] === INÍCIO DA FUNÇÃO CHAT-WITH-CLAUDE ===`);
  console.log(`[${requestId}] Method: ${req.method}`);
  console.log(`[${requestId}] Timestamp: ${new Date().toISOString()}`);

  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log(`[${requestId}] Retornando resposta CORS OPTIONS`);
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validar método HTTP
    if (req.method !== 'POST') {
      console.error(`[${requestId}] Método HTTP inválido: ${req.method}`);
      return createSecureResponse({ 
        error: 'Method not allowed',
        success: false,
        requestId
      });
    }

    // Health check da API key
    if (!anthropicApiKey) {
      console.error(`[${requestId}] ANTHROPIC_API_KEY não encontrada nas variáveis de ambiente`);
      return createSecureResponse({ 
        error: 'AI service not configured', 
        details: 'ANTHROPIC_API_KEY missing',
        success: false,
        requestId
      });
    }

    console.log(`[${requestId}] ANTHROPIC_API_KEY configurada: ${anthropicApiKey.substring(0, 10)}...`);

    // Validar token de autenticação
    const authHeader = req.headers.get('Authorization');
    console.log(`[${requestId}] Auth header presente: ${!!authHeader}`);
    
    if (!validateAuthToken(authHeader)) {
      console.error(`[${requestId}] Token de autenticação inválido`);
      return createSecureResponse({ 
        error: 'Unauthorized',
        success: false,
        requestId
      });
    }

    // Obter dados da requisição
    let rawBody;
    try {
      rawBody = await req.json();
      console.log(`[${requestId}] Body recebido - tamanho: ${JSON.stringify(rawBody).length} chars`);
    } catch (error) {
      console.error(`[${requestId}] Erro ao parsear JSON: ${error.message}`);
      return createSecureResponse({ 
        error: 'Invalid JSON in request body',
        details: error.message,
        success: false,
        requestId
      });
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
      console.error(`[${requestId}] Campos obrigatórios ausentes: message=${!!message}, userId=${!!userId}`);
      return createSecureResponse({ 
        error: 'Missing required fields', 
        details: 'message and userId are required',
        success: false,
        requestId
      });
    }

    console.log(`[${requestId}] Dados validados:`, {
      userId: userId.substring(0, 8) + '...',
      messageLength: message.length,
      agentName,
      productId: productId?.substring(0, 8) + '...',
      historyLength: Array.isArray(chatHistory) ? chatHistory.length : 0
    });

    // Rate limiting por usuário
    if (!checkRateLimit(`chat:${userId}`, 30, 60000)) {
      console.error(`[${requestId}] Rate limit excedido para usuário: ${userId.substring(0, 8)}...`);
      return createSecureResponse({ 
        error: 'Rate limit exceeded', 
        details: 'Please try again in a moment',
        success: false,
        requestId
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Preparar prompt do sistema
    let systemPrompt = agentPrompt || "Você é um assistente de IA especializado em copywriting e marketing.";
    console.log(`[${requestId}] System prompt configurado - tamanho: ${systemPrompt.length} chars`);
    
    // Preparar mensagens para Claude
    const conversationMessages = Array.isArray(chatHistory) ? chatHistory.slice(-15) : [];
    const claudeMessages = conversationMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: String(msg.content || '').trim()
    })).filter(msg => msg.content.length > 0);

    claudeMessages.push({
      role: 'user',
      content: String(message).trim()
    });

    console.log(`[${requestId}] Mensagens preparadas:`, {
      totalMessages: claudeMessages.length,
      systemPromptLength: systemPrompt.length,
      lastMessage: claudeMessages[claudeMessages.length - 1]?.content?.substring(0, 100) + '...'
    });

    // Função para tentar chamada com diferentes modelos
    async function tryClaudeAPI(modelIndex = 0, attempt = 1) {
      if (modelIndex >= CLAUDE_MODELS.length) {
        throw new Error('Todos os modelos Claude falharam');
      }

      const currentModel = CLAUDE_MODELS[modelIndex];
      console.log(`[${requestId}] Tentativa ${attempt} com modelo: ${currentModel}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicApiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: currentModel,
            max_tokens: 4000,
            system: systemPrompt,
            messages: claudeMessages,
            temperature: 0.7
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log(`[${requestId}] Resposta Claude recebida:`, {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          modelo: currentModel
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[${requestId}] Erro da API Claude:`, {
            status: response.status,
            statusText: response.statusText,
            body: errorText.substring(0, 500),
            modelo: currentModel
          });

          // Se for erro 404 (modelo não encontrado), tenta próximo modelo
          if (response.status === 404) {
            console.log(`[${requestId}] Modelo ${currentModel} não encontrado, tentando próximo...`);
            return await tryClaudeAPI(modelIndex + 1, attempt);
          }
          
          // Se for erro 429 (rate limit) ou 5xx, tenta novamente
          if ((response.status === 429 || response.status >= 500) && attempt < MAX_RETRIES) {
            console.log(`[${requestId}] Erro temporário, tentando novamente em 2s...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return await tryClaudeAPI(modelIndex, attempt + 1);
          }

          throw new Error(`Claude API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log(`[${requestId}] Resposta Claude processada com sucesso:`, {
          modelo: currentModel,
          contentLength: data.content?.[0]?.text?.length || 0,
          usage: data.usage
        });

        return { data, model: currentModel };

      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          console.error(`[${requestId}] Timeout na requisição para Claude com modelo ${currentModel}`);
          if (attempt < MAX_RETRIES) {
            console.log(`[${requestId}] Tentando novamente após timeout...`);
            return await tryClaudeAPI(modelIndex, attempt + 1);
          }
          throw new Error('Request timeout - Claude API não respondeu a tempo');
        }
        
        console.error(`[${requestId}] Erro na requisição para Claude:`, {
          error: error.message,
          modelo: currentModel,
          tentativa: attempt
        });

        // Tenta próximo modelo se disponível
        if (modelIndex + 1 < CLAUDE_MODELS.length) {
          console.log(`[${requestId}] Tentando próximo modelo disponível...`);
          return await tryClaudeAPI(modelIndex + 1, attempt);
        }

        throw error;
      }
    }

    // Executar chamada para Claude com retry e fallback
    const { data: claudeData, model: usedModel } = await tryClaudeAPI();

    const aiResponse = claudeData.content?.[0]?.text;
    
    if (!aiResponse || aiResponse.trim().length === 0) {
      console.error(`[${requestId}] Resposta vazia do Claude:`, {
        hasContent: !!claudeData.content,
        contentArray: claudeData.content,
        modelo: usedModel
      });
      
      return createSecureResponse({ 
        error: 'Empty response from AI service',
        details: 'Claude retornou uma resposta vazia',
        success: false,
        requestId
      });
    }

    // Calcular tokens usados
    const usage = claudeData.usage || {};
    const inputTokens = usage.input_tokens || Math.ceil(JSON.stringify(claudeMessages).length / 4);
    const outputTokens = usage.output_tokens || Math.ceil(aiResponse.length / 4);
    const totalTokens = inputTokens + outputTokens;

    console.log(`[${requestId}] Processamento concluído com sucesso:`, {
      userId: userId.substring(0, 8) + '...',
      modelo: usedModel,
      inputTokens,
      outputTokens,
      totalTokens,
      responseLength: aiResponse.length
    });

    return createSecureResponse({
      response: aiResponse,
      tokensUsed: totalTokens,
      model: usedModel,
      usage: {
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: totalTokens
      },
      success: true,
      requestId
    });

  } catch (error) {
    console.error(`[${requestId}] === ERRO CRÍTICO NA FUNÇÃO ===`);
    console.error(`[${requestId}] Error name: ${error.name}`);
    console.error(`[${requestId}] Error message: ${error.message}`);
    console.error(`[${requestId}] Error stack: ${error.stack}`);
    
    return createSecureResponse({ 
      error: 'Internal server error',
      details: error.message,
      success: false,
      requestId,
      // Remover stack trace em produção por segurança
      ...(Deno.env.get('ENVIRONMENT') === 'development' && { stack: error.stack })
    });
  }
});
