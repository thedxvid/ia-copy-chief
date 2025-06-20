
import { ClaudeMessage, ClaudeResponse } from './types.ts';

// Função otimizada para chamar Claude com limites aumentados
export async function callClaudeAPI(
  systemPrompt: string, 
  messages: ClaudeMessage[], 
  attempt: number = 1
): Promise<ClaudeResponse> {
  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!;
  
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
