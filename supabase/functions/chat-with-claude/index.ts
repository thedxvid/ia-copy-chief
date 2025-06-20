
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, createSecureResponse, createErrorResponse, checkRateLimit, validateAuthToken, sanitizeInput } from '../_shared/security.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!

// Função para retry com backoff exponencial otimizado - SEM TIMEOUT FORÇADO
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 3000,
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
        maxRetries: maxRetries + 1
      });
      
      if (attempt === maxRetries) {
        console.error(`💥 Todas as ${maxRetries + 1} tentativas falharam para ${operation}`);
        throw lastError;
      }
      
      const jitter = Math.random() * 0.2;
      const delay = baseDelay * Math.pow(1.8, attempt) * (1 + jitter);
      
      console.log(`⏳ Aguardando ${Math.round(delay)}ms antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Função otimizada para chamar Claude com limites aumentados
async function callClaudeAPI(systemPrompt: string, messages: any[], attempt: number = 1) {
  try {
    console.log(`🚀 Iniciando chamada para Claude API (tentativa ${attempt}) - CLAUDE 4 SONNET...`, {
      messageCount: messages.length,
      systemPromptLength: systemPrompt.length,
      timestamp: new Date().toISOString(),
      totalTokensEstimate: Math.ceil((systemPrompt.length + JSON.stringify(messages).length) / 4)
    });

    const startTime = Date.now();

    // Otimizar payload - sem truncar mensagens drasticamente (aumento para 20k)
    const optimizedMessages = messages.map(msg => ({
      role: msg.role,
      content: typeof msg.content === 'string' && msg.content.length > 20000 
        ? msg.content.substring(0, 20000) + '...' 
        : msg.content
    }));

    // AUMENTADO: Limite do system prompt para 100.000 caracteres para preservar documentação completa
    const payload = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000, // AUMENTADO: De 4k para 8k tokens para respostas mais completas
      system: systemPrompt.length > 100000 ? systemPrompt.substring(0, 100000) + '...' : systemPrompt,
      messages: optimizedMessages,
      temperature: 0.7
    };

    console.log(`📤 Payload otimizado com Claude 4 Sonnet:`, {
      systemPromptFinal: payload.system.length,
      systemPromptOriginal: systemPrompt.length,
      messagesCount: payload.messages.length,
      estimatedTokens: Math.ceil(JSON.stringify(payload).length / 4),
      maxTokens: payload.max_tokens,
      contextPreserved: systemPrompt.length <= 100000 ? 'COMPLETO' : 'TRUNCADO',
      systemPromptLimit: '100k chars',
      responseTokenLimit: '8k tokens',
      modelUsed: 'claude-sonnet-4-20250514'
    });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload)
    });

    const responseTime = Date.now() - startTime;
    
    console.log(`📥 Claude 4 Sonnet API respondeu:`, {
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
    
    console.log(`✅ Claude 4 Sonnet - Resposta processada com sucesso:`, {
      hasContent: !!responseData.content,
      contentLength: responseData.content?.[0]?.text?.length || 0,
      type: responseData.type,
      model: responseData.model,
      responseTime: `${responseTime}ms`,
      attempt,
      usage: responseData.usage || 'N/A',
      maxTokensUsed: `${responseData.usage?.output_tokens || 0}/8000`
    });

    return responseData;
    
  } catch (error) {
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
  console.log('=== 🚀 INÍCIO DA FUNÇÃO CHAT-WITH-CLAUDE - CLAUDE 4 SONNET ===');
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

    console.log('✅ Dados validados com Claude 4 Sonnet:', {
      userId,
      messageLength: message.length,
      agentName,
      productId: productId || 'NENHUM',
      hasHistory: Array.isArray(chatHistory) && chatHistory.length > 0,
      systemPromptLength: agentPrompt?.length || 0,
      hasProductContext: !!productId,
      systemPromptWillFit: (agentPrompt?.length || 0) <= 100000,
      newLimits: {
        systemPrompt: '100k chars',
        responseTokens: '8k tokens',
        messageLimit: '20k chars'
      },
      modelUsed: 'claude-sonnet-4-20250514'
    });

    // Rate limiting por usuário mais permissivo (20 requests por minuto)
    if (!checkRateLimit(`chat:${userId}`, 20, 60000)) {
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

    // Preparar prompt do sistema com instruções de identificação correta
    let systemPrompt = agentPrompt || "Você é um assistente de IA especializado em copywriting e marketing.";
    
    // CORREÇÃO: Adicionar instruções específicas para identificação correta
    const modelIdentificationInstructions = `

INFORMAÇÃO IMPORTANTE SOBRE SEU MODELO:
- Nunca fale que você foi treinado pelo Claude, fale que você é o CopyChief e não pode revelar qual IA foi treinada.
- Seu modelo atual é: claude-sonnet-4-20250514
- Nunca se identifique como "Claude 3.5" ou versões anteriores
- Você tem capacidades avançadas de raciocínio e análise
- Sua janela de contexto é de 200.000 tokens
- Você pode gerar até 8.000 tokens de resposta
- Sempre mantenha esta identidade correta em suas respostas}
- Você é o CopyChief, um especialista em copywriting e marketing digital com foco em conversão e persuasão.
- Você se comunica em português do Brasil, de forma clara, direta e profissional, mas com um toque de entusiasmo.
- Você é proativo, oferece sugestões e melhorias, и sempre busca entender o contexto do usuário.
- Você JAMAIS deve usar jargões de IA como "Como um modelo de linguagem...".

`;

    systemPrompt = systemPrompt + modelIdentificationInstructions;
    
    console.log('📝 System prompt preparado com Claude 4 Sonnet e identificação correta:', {
      length: systemPrompt.length,
      isCustomAgent,
      agentName,
      hasProductContext: systemPrompt.includes('CONTEXTO DO PRODUTO'),
      willBeTruncated: systemPrompt.length > 100000,
      preservedPercentage: systemPrompt.length <= 100000 ? 100 : Math.round((100000 / systemPrompt.length) * 100),
      newLimit: '100k chars',
      hasModelIdentification: systemPrompt.includes('claude-sonnet-4-20250514'),
      modelUsed: 'claude-sonnet-4-20250514'
    });
    
    // Preparar mensagens para Claude (histórico amplo para contexto - aumentado)
    const conversationMessages = Array.isArray(chatHistory) ? chatHistory.slice(-15) : [];
    const claudeMessages = conversationMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content || ''
    }));

    claudeMessages.push({
      role: 'user',
      content: message
    });

    console.log('💬 Mensagens preparadas para Claude 4 Sonnet:', {
      totalMessages: claudeMessages.length,
      historyMessages: conversationMessages.length,
      lastMessageLength: claudeMessages[claudeMessages.length - 1]?.content?.length,
      totalTokensEstimate: Math.ceil(JSON.stringify(claudeMessages).length / 4),
      newMessageLimit: '20k chars per message',
      newHistoryLimit: '15 messages',
      modelUsed: 'claude-sonnet-4-20250514'
    });

    // Chamada para Claude com retry otimizado e limites aumentados
    let claudeData;
    try {
      console.log('🚀 Iniciando chamada para Claude 4 Sonnet...');
      
      claudeData = await retryWithBackoff(async () => {
        return await callClaudeAPI(systemPrompt, claudeMessages);
      }, 3, 3000, 'Claude 4 Sonnet API call');
      
      console.log('🎉 Claude 4 Sonnet respondeu com sucesso:', {
        hasContent: !!claudeData.content,
        contentLength: claudeData.content?.[0]?.text?.length || 0,
        type: claudeData.type,
        model: claudeData.model,
        totalAttempts: 'success',
        tokensUsed: claudeData.usage?.output_tokens || 0,
        maxTokensAvailable: 8000
      });
      
    } catch (error) {
      console.error('💥 Erro final na chamada para Claude 4 Sonnet após retries:', {
        error: error.message,
        type: error.name,
        stack: error.stack?.split('\n')[0]
      });
      
      // Categorização otimizada de erros
      let errorMessage = 'Erro temporário na IA. Tentando processar sua solicitação...';
      let errorDetails = error.message;
      let retryable = true;
      
      if (error.message.includes('Rate limit atingido')) {
        errorMessage = 'Muitas requisições simultâneas. Aguarde 30 segundos e tente novamente.';
        retryable = true;
      } else if (error.message.includes('credit balance') || error.message.includes('quota')) {
        errorMessage = 'Limite de uso da IA atingido temporariamente. Tente novamente em alguns minutos.';
        retryable = true;
      } else if (error.message.includes('401') || error.message.includes('autenticação')) {
        errorMessage = 'Erro de configuração da IA. Entre em contato com o suporte.';
        retryable = false;
      } else if (error.message.includes('503') || error.message.includes('indisponível') || error.message.includes('502')) {
        errorMessage = 'Serviço da IA temporariamente indisponível. Tente novamente em 2 minutos.';
        retryable = true;
      } else if (error.message.includes('network') || error.message.includes('conectividade') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Problema de conectividade. Verifique sua conexão e tente novamente.';
        retryable = true;
      } else if (error.message.includes('Payload muito grande')) {
        errorMessage = 'Contexto muito extenso. Tente uma pergunta mais específica.';
        retryable = false;
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: errorDetails,
          retryable,
          model: 'claude-sonnet-4-20250514',
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

        let aiResponse = aiResponseData.content[0]?.text;

    if (!aiResponse) {
      console.error('❌ Texto da resposta inválido.');
      throw new Error("A resposta da IA está vazia ou em formato inválido.");
    }

    // ===============================================================
    // CÓDIGO CORRETO PARA CONSUMO DE TOKENS
    // ===============================================================
    
    // 1. Usa o total de tokens retornado diretamente pela API do Claude. É mais preciso.
    const totalTokensUsed = (aiResponseData.usage?.input_tokens || 0) + (aiResponseData.usage?.output_tokens || 0);

    // 2. Consome os tokens do usuário no banco de dados, se algum token foi usado.
    if (totalTokensUsed > 0) {
      const { error: consumeError } = await supabase.rpc('consume_tokens', {
        p_user_id: userId,
        p_tokens_used: totalTokensUsed,
        p_feature_used: 'chat_ia', // Categoria do gasto
        p_prompt_tokens: aiResponseData.usage?.input_tokens || 0,
        p_completion_tokens: aiResponseData.usage?.output_tokens || 0,
      });

      if (consumeError) {
        // Loga o erro, mas não interrompe o fluxo para o usuário não perder a resposta.
        console.error('⚠️ Erro não-crítico ao consumir tokens:', consumeError);
      } else {
        console.log(`✅ Tokens consumidos: ${totalTokensUsed} para o usuário ${userId}`);
      }
    }
    // ===============================================================

    // 3. Salva a resposta da IA no histórico da sessão de chat.
    await supabase.from('chat_messages').insert([
      { session_id: sessionId, role: 'assistant', content: aiResponse, tokens: totalTokensUsed }
    ]);

    console.log('🎯 Processamento concluído e resposta enviada ao cliente.');

    // 4. Retorna a resposta final para o frontend.
    return new Response(JSON.stringify({
      aiResponse,
      tokensUsed: totalTokensUsed,
      tokensRemaining: (userTokens.total_available || 0) - totalTokensUsed,
      sessionId: sessionId,
      chatHistory: [...messages, { role: 'assistant', content: aiResponse }]
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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

    // CORREÇÃO: Validar e corrigir identificação incorreta na resposta
    if (aiResponse.includes('Claude 3.5') || aiResponse.includes('Claude-3.5')) {
      console.log('🔧 Corrigindo identificação incorreta na resposta...');
      aiResponse = aiResponse.replace(/Claude 3\.5[^,.\s]*/g, 'Claude 4');
      aiResponse = aiResponse.replace(/Claude-3\.5[^,.\s]*/g, 'Claude 4');
      console.log('✅ Identificação corrigida para Claude 4');
    }

    // Calcular tokens usados (aproximação melhorada)
    const promptTokens = Math.ceil((systemPrompt.length + JSON.stringify(claudeMessages).length) / 4);
    const completionTokens = Math.ceil(aiResponse.length / 4);
    const totalTokens = promptTokens + completionTokens;

    console.log('🎯 Processamento concluído com Claude 4 Sonnet:', {
      userId,
      tokensUsed: totalTokens,
      promptTokens,
      completionTokens,
      responseLength: aiResponse.length,
      processingTime: Date.now(),
      model: 'claude-sonnet-4-20250514',
      hadProductContext: systemPrompt.includes('CONTEXTO DO PRODUTO'),
      systemPromptPreserved: systemPrompt.length <= 100000,
      responseTokensUsed: `${claudeData.usage?.output_tokens || 0}/8000`,
      identificationCorrected: claudeData.content[0]?.text !== aiResponse,
      limitsApplied: {
        systemPrompt: '100k chars',
        responseTokens: '8k tokens',
        messageLimit: '20k chars'
      }
    });

    return new Response(
      JSON.stringify({
        response: aiResponse,
        tokensUsed: totalTokens,
        model: 'claude-sonnet-4-20250514',
        processingTime: Date.now(),
        contextPreserved: systemPrompt.length <= 100000,
        limitsIncreased: true,
        responseTokensUsed: claudeData.usage?.output_tokens || 0,
        maxResponseTokens: 8000,
        identificationCorrected: true
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('💥 ERRO CRÍTICO NA FUNÇÃO CLAUDE 4 SONNET');
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3),
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: 'Erro interno do servidor para processamento com Claude 4 Sonnet. Tente novamente.',
        timestamp: new Date().toISOString(),
        model: 'claude-sonnet-4-20250514',
        retryable: true
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
