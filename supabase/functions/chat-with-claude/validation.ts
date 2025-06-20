
import { ChatRequest } from './types.ts';

export function validateRequest(req: Request): boolean {
  if (req.method !== 'POST') {
    console.error('❌ Método HTTP inválido:', req.method);
    return false;
  }
  return true;
}

export function validateApiKey(): boolean {
  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicApiKey) {
    console.error('❌ ANTHROPIC_API_KEY não encontrada nas variáveis de ambiente');
    return false;
  }
  console.log('🔑 ANTHROPIC_API_KEY configurada:', anthropicApiKey ? 'Sim' : 'Não');
  return true;
}

export function validateChatRequest(body: any): { isValid: boolean; data?: ChatRequest; error?: string } {
  const { message, userId } = body;
  
  if (!message || !userId) {
    console.error('❌ Campos obrigatórios ausentes:', { 
      message: !!message, 
      userId: !!userId 
    });
    return {
      isValid: false,
      error: 'message and userId are required'
    };
  }
  
  return {
    isValid: true,
    data: body as ChatRequest
  };
}

export function categorizeError(error: Error): { message: string; details: string; retryable: boolean } {
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
  
  return { message: errorMessage, details: errorDetails, retryable };
}
