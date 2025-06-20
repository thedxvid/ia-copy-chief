
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
      userId 
    } = chatRequest;

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
        tokensUsed: claudeData.usage?.output_tokens || 0,
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
