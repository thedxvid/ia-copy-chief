
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, createSecureResponse, createErrorResponse, checkRateLimit, validateAuthToken, sanitizeInput } from '../_shared/security.ts'
import { ChatRequest, ClaudeResponse } from './types.ts'
import { retryWithBackoff, prepareSystemPrompt, prepareChatMessages, correctClaudeIdentification } from './utils.ts'
import { callClaudeAPI } from './claude-api.ts'
import { validateRequest, validateApiKey, validateChatRequest, categorizeError } from './validation.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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

  let userId: string | null = null;

  try {
    // Validar método HTTP
    if (!validateRequest(req)) {
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
    if (!validateApiKey()) {
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
    const validation = validateChatRequest(body);
    
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields', 
          details: validation.error,
          retryable: false
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const chatRequest = validation.data!;
    const { 
      message, 
      agentPrompt, 
      chatHistory, 
      agentName, 
      isCustomAgent, 
      customAgentId, 
      productId, 
      userId: requestUserId 
    } = chatRequest;

    userId = requestUserId;

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

    // NOVA VERIFICAÇÃO: Status da assinatura ANTES de qualquer operação
    console.log('🔒 Verificando status da assinatura para usuário:', userId);
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_status, monthly_tokens, extra_tokens, total_tokens_used')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('❌ Erro ao verificar perfil do usuário:', profileError);
      return new Response(
        JSON.stringify({ 
          error: 'User profile verification failed',
          details: 'Erro ao verificar dados do usuário',
          retryable: true
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!profile) {
      console.error('❌ Perfil do usuário não encontrado:', userId);
      return new Response(
        JSON.stringify({ 
          error: 'User profile not found',
          details: 'Perfil do usuário não encontrado',
          retryable: false
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verificar se a assinatura está ativa
    if (profile.subscription_status !== 'active') {
      console.error('🚫 Assinatura não ativa para usuário:', {
        userId,
        currentStatus: profile.subscription_status
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Subscription not active',
          details: 'A sua assinatura não está ativa. Por favor, regularize seu pagamento para continuar usando o serviço.',
          subscriptionStatus: profile.subscription_status,
          retryable: false
        }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ Assinatura ativa confirmada para usuário:', userId);

    // NOVA VALIDAÇÃO: Verificar se o usuário tem saldo mínimo ANTES de chamar a IA
    console.log('💰 Verificando saldo mínimo para usuário:', userId);
    
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('get_available_tokens', { p_user_id: userId });

    if (tokenError) {
      console.error('❌ Erro ao verificar tokens:', tokenError);
      return new Response(
        JSON.stringify({ 
          error: 'Token verification failed',
          details: 'Erro ao verificar saldo de tokens',
          retryable: true
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!tokenData || tokenData.length === 0) {
      console.error('❌ Nenhum dado de token encontrado para usuário:', userId);
      return new Response(
        JSON.stringify({ 
          error: 'User tokens not found',
          details: 'Dados de tokens não encontrados para o usuário',
          retryable: false
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const userTokens = tokenData[0];
    console.log('💰 Tokens do usuário:', {
      totalAvailable: userTokens.total_available,
      monthlyTokens: userTokens.monthly_tokens,
      extraTokens: userTokens.extra_tokens,
      totalUsed: userTokens.total_used
    });

    // NOVA VERIFICAÇÃO: Apenas verificar se o usuário tem saldo positivo
    if (userTokens.total_available <= 0) {
      console.error('💸 Saldo insuficiente para iniciar conversa:', {
        available: userTokens.total_available
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient tokens',
          details: 'Créditos insuficientes para iniciar uma nova conversa. Recarregue seu saldo.',
          tokensAvailable: userTokens.total_available,
          retryable: false
        }),
        { 
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ Saldo positivo confirmado. Prosseguindo com chamada à IA...');

    // Preparar prompt do sistema com instruções de identificação correta
    const systemPrompt = prepareSystemPrompt(agentPrompt);
    
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
    const claudeMessages = prepareChatMessages(chatHistory || [], message);

    console.log('💬 Mensagens preparadas para Claude 4 Sonnet:', {
      totalMessages: claudeMessages.length,
      historyMessages: (chatHistory || []).length,
      lastMessageLength: claudeMessages[claudeMessages.length - 1]?.content?.length,
      totalTokensEstimate: Math.ceil(JSON.stringify(claudeMessages).length / 4),
      newMessageLimit: '20k chars per message',
      newHistoryLimit: '15 messages',
      modelUsed: 'claude-sonnet-4-20250514'
    });

    // Chamada para Claude com retry otimizado e limites aumentados
    let claudeData: ClaudeResponse;
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
        outputTokens: claudeData.usage?.output_tokens || 0,
        inputTokens: claudeData.usage?.input_tokens || 0,
        maxTokensAvailable: 8000
      });
      
    } catch (error) {
      console.error('💥 Erro final na chamada para Claude 4 Sonnet após retries:', {
        error: error.message,
        type: error.name,
        stack: error.stack?.split('\n')[0]
      });
      
      const errorInfo = categorizeError(error);
      
      return new Response(
        JSON.stringify({ 
          error: errorInfo.message,
          details: errorInfo.details,
          retryable: errorInfo.retryable,
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

    let aiResponse = claudeData.content[0]?.text;

    if (!aiResponse) {
      console.error('❌ Texto da resposta inválido.');
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
    aiResponse = correctClaudeIdentification(aiResponse);

    // NOVA LÓGICA: Extrair o custo REAL (output_tokens) da resposta
    const outputTokens = claudeData.usage?.output_tokens;
    const inputTokens = claudeData.usage?.input_tokens || 0;
    
    if (typeof outputTokens !== 'number' || outputTokens < 0) {
      console.error('❌ Não foi possível extrair tokens de saída válidos da resposta:', {
        usage: claudeData.usage,
        outputTokens,
        type: typeof outputTokens
      });
      return new Response(
        JSON.stringify({ 
          error: 'Invalid token cost from AI service',
          details: 'Erro ao processar o custo da resposta',
          retryable: false
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('💰 Custo real extraído da resposta:', {
      outputTokens,
      inputTokens,
      totalTokens: inputTokens + outputTokens,
      onlyChargingFor: 'output_tokens'
    });

    // NOVA LÓGICA: Deduzir apenas os tokens de saída usando a função segura
    let deductionSuccess = true;
    if (outputTokens > 0) {
      console.log('💳 Deduzindo tokens de saída:', outputTokens);
      
      const { data: deductionResult, error: deductionError } = await supabase
        .rpc('secure_deduct_tokens', {
          p_user_id: userId,
          p_amount: outputTokens,
          p_feature_used: 'chat_output_tokens'
        });

      if (deductionError || !deductionResult) {
        console.warn('⚠️ Dedução de tokens falhou após geração da resposta:', {
          userId,
          outputTokens,
          error: deductionError?.message,
          deductionResult
        });
        deductionSuccess = false;
        
        // Não bloquear a resposta, mas registrar o problema
        // A resposta foi gerada e deve ser retornada ao usuário
      } else {
        console.log('✅ Tokens de saída deduzidos com sucesso:', outputTokens);
      }
    } else {
      console.log('ℹ️ Resposta não gerou tokens de saída para deduzir');
    }

    // Registrar o uso para auditoria
    try {
      const { error: usageError } = await supabase
        .from('token_usage')
        .insert({
          user_id: userId,
          tokens_used: outputTokens,
          feature_used: 'chat_output_tokens',
          prompt_tokens: inputTokens,
          completion_tokens: outputTokens,
          total_tokens: outputTokens // Apenas output_tokens são cobrados
        });

      if (usageError) {
        console.error('❌ Erro ao registrar uso de tokens:', usageError);
      } else {
        console.log('✅ Uso de tokens registrado para auditoria');
      }
    } catch (auditError) {
      console.error('❌ Erro ao registrar auditoria:', auditError);
    }

    console.log('🎯 Processamento concluído com Claude 4 Sonnet:', {
      userId,
      outputTokensCharged: outputTokens,
      inputTokensNotCharged: inputTokens,
      responseLength: aiResponse.length,
      processingTime: Date.now(),
      model: 'claude-sonnet-4-20250514',
      hadProductContext: systemPrompt.includes('CONTEXTO DO PRODUTO'),
      systemPromptPreserved: systemPrompt.length <= 100000,
      deductionSuccess,
      chargingModel: 'output_tokens_only',
      limitsApplied: {
        systemPrompt: '100k chars',
        responseTokens: '8k tokens',
        messageLimit: '20k chars'
      }
    });

    return new Response(
      JSON.stringify({
        response: aiResponse,
        tokensUsed: outputTokens, // Apenas tokens de saída
        inputTokens: inputTokens, // Para informação
        outputTokens: outputTokens, // Para informação
        model: 'claude-sonnet-4-20250514',
        processingTime: Date.now(),
        contextPreserved: systemPrompt.length <= 100000,
        limitsIncreased: true,
        chargingModel: 'output_tokens_only',
        deductionSuccess: deductionSuccess
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
      timestamp: new Date().toISOString(),
      userId
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
