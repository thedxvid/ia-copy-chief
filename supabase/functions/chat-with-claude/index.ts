
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  agentPrompt: string;
  chatHistory: Message[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY não configurada');
    }

    const { message, agentPrompt, chatHistory }: ChatRequest = await req.json();

    // Construir histórico de mensagens para o Claude
    const messages: any[] = [];
    
    // Adicionar histórico anterior
    chatHistory.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });
    
    // Adicionar mensagem atual
    messages.push({
      role: 'user',
      content: message
    });

    // Configurar o sistema prompt com o prompt específico do agente
    const systemPrompt = `${agentPrompt}

Instruções adicionais:
- Seja sempre útil, preciso e criativo
- Forneça respostas práticas e aplicáveis
- Use exemplos quando apropriado
- Mantenha um tom profissional mas acessível
- Se precisar de mais informações, faça perguntas específicas
- Limite suas respostas a aproximadamente 4000 tokens`;

    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicApiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022', // Usando modelo disponível
            max_tokens: 4000,
            system: systemPrompt,
            messages: messages
          }),
        });

        if (response.status === 429) {
          // Rate limiting - aguardar e tentar novamente
          const waitTime = Math.pow(2, retryCount) * 1000; // Backoff exponencial
          await new Promise(resolve => setTimeout(resolve, waitTime));
          retryCount++;
          continue;
        }

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`API Error: ${response.status} - ${errorData}`);
        }

        const data = await response.json();
        
        if (!data.content || !data.content[0] || !data.content[0].text) {
          throw new Error('Resposta inválida da API do Claude');
        }

        return new Response(
          JSON.stringify({ 
            response: data.content[0].text,
            usage: data.usage
          }), 
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );

      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          throw error;
        }
        
        // Aguardar antes de tentar novamente
        const waitTime = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

  } catch (error) {
    console.error('Erro na função chat-with-claude:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
