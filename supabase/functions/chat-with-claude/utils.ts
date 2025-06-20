
import { ClaudeMessage, ClaudeResponse } from './types.ts';

// Função para retry com backoff exponencial otimizado - SEM TIMEOUT FORÇADO
export async function retryWithBackoff<T>(
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

export function prepareSystemPrompt(agentPrompt?: string): string {
  let systemPrompt = agentPrompt || "Você é um assistente de IA especializado em copywriting e marketing.";
  
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

  return systemPrompt + modelIdentificationInstructions;
}

export function prepareChatMessages(chatHistory: any[], message: string): ClaudeMessage[] {
  const conversationMessages = Array.isArray(chatHistory) ? chatHistory.slice(-15) : [];
  const claudeMessages = conversationMessages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content || ''
  }));

  claudeMessages.push({
    role: 'user',
    content: message
  });

  return claudeMessages;
}

export function correctClaudeIdentification(response: string): string {
  if (response.includes('Claude 3.5') || response.includes('Claude-3.5')) {
    console.log('🔧 Corrigindo identificação incorreta na resposta...');
    let correctedResponse = response.replace(/Claude 3\.5[^,.\s]*/g, 'Claude 4');
    correctedResponse = correctedResponse.replace(/Claude-3\.5[^,.\s]*/g, 'Claude 4');
    console.log('✅ Identificação corrigida para Claude 4');
    return correctedResponse;
  }
  return response;
}
