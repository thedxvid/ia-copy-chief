import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatHistory {
  [agentId: string]: Message[];
}

export const useAgentChat = (agentId: string) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(`chat-${agentId}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const saveToStorage = useCallback((msgs: Message[]) => {
    localStorage.setItem(`chat-${agentId}`, JSON.stringify(msgs));
  }, [agentId]);

  const triggerWebhook = useCallback(async (userMessage: string, agentName: string) => {
    try {
      const webhookUrl = 'https://n8n.srv830837.hstgr.cloud/webhook-test/chat-user-message';
      
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify({
          message: userMessage,
          agentId: agentId,
          agentName: agentName,
          userId: user?.id || 'anonymous',
          timestamp: new Date().toISOString(),
          source: 'agent-chat',
          sessionId: `chat_${agentId}_${Date.now()}`,
          messageCount: messages.length + 1
        }),
      });

      console.log('N8n webhook triggered successfully for agent:', agentName);
    } catch (error) {
      console.error('Error triggering N8n webhook:', error);
    }
  }, [agentId, user?.id, messages.length]);

  const sendMessage = useCallback(async (content: string, agentPrompt: string, agentName?: string, isCustomAgent?: boolean) => {
    if (!content.trim()) return;

    console.log('=== SEND MESSAGE DEBUG ===');
    console.log('Content:', content);
    console.log('Agent Name:', agentName);
    console.log('Is Custom:', isCustomAgent);
    console.log('User ID:', user?.id);

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => {
      const updated = [...prev, userMessage];
      saveToStorage(updated);
      return updated;
    });

    // Disparar webhook N8n quando usuário envia mensagem
    if (agentName) {
      triggerWebhook(content, agentName);
    }

    setIsLoading(true);

    try {
      console.log('=== CALLING EDGE FUNCTION ===');
      console.log('Calling chat-with-claude edge function...');
      
      const requestBody = {
        message: content,
        agentPrompt,
        chatHistory: messages,
        agentName: agentName || 'Agente IA',
        isCustomAgent: isCustomAgent || false,
        userId: user?.id
      };

      console.log('Request body:', {
        ...requestBody,
        agentPrompt: agentPrompt ? `${agentPrompt.substring(0, 100)}...` : 'MISSING',
        chatHistory: `${messages.length} messages`
      });
      
      const { data, error } = await supabase.functions.invoke('chat-with-claude', {
        body: requestBody
      });

      console.log('=== EDGE FUNCTION RESPONSE ===');
      console.log('Error:', error);
      console.log('Data:', data);

      if (error) {
        console.error('Edge function error:', error);
        
        // **Tratamento específico para tokens insuficientes**
        if (error.message?.includes('Tokens insuficientes') || 
            error.details?.includes('tokens') || 
            error.context?.status === 402) {
          toast.error('❌ Tokens Insuficientes!', {
            description: 'Você não tem tokens suficientes para esta conversa. Aguarde o reset mensal ou economize tokens.',
            duration: 8000,
          });
          
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: '❌ **Tokens Insuficientes**\n\nDesculpe, você não tem tokens suficientes para continuar esta conversa. Seus tokens serão renovados no início do próximo mês (dia 1º).\n\n💡 **Dicas para economizar:**\n- Seja mais direto nas perguntas\n- Evite conversas muito longas\n- Use comandos específicos',
            role: 'assistant',
            timestamp: new Date()
          };

          setMessages(prev => {
            const updated = [...prev, errorMessage];
            saveToStorage(updated);
            return updated;
          });
          
          return;
        }

        // **Tratamento para configuração incompleta**
        if (error.message?.includes('ambiente incompleta') || 
            error.message?.includes('ANTHROPIC_API_KEY') ||
            error.context?.status === 503) {
          toast.error('❌ Configuração Incompleta!', {
            description: 'A chave da API do Claude não está configurada. Entre em contato com o suporte.',
            duration: 8000,
          });
          
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: '❌ **Configuração Incompleta**\n\nDesculpe, há um problema na configuração do sistema. A chave da API do Claude não está configurada corretamente.\n\n🔧 **O que fazer:**\n- Entre em contato com o suporte\n- Aguarde a correção da configuração\n- Tente novamente em alguns minutos',
            role: 'assistant',
            timestamp: new Date()
          };

          setMessages(prev => {
            const updated = [...prev, errorMessage];
            saveToStorage(updated);
            return updated;
          });
          
          return;
        }

        // **Tratamento para erro de validação da API (400)**
        if (error.context?.status === 400 || error.message?.includes('400')) {
          toast.error('❌ Erro de Validação!', {
            description: 'Erro na estrutura da mensagem. Tente reformular sua pergunta.',
            duration: 6000,
          });
          
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: '❌ **Erro de Validação**\n\nOcorreu um erro na estrutura da mensagem enviada. Tente reformular sua pergunta de forma mais simples ou direta.\n\n💭 **Dica:**\nTente ser mais específico em sua pergunta e evite caracteres especiais.',
            role: 'assistant',
            timestamp: new Date()
          };

          setMessages(prev => {
            const updated = [...prev, errorMessage];
            saveToStorage(updated);
            return updated;
          });
          
          return;
        }
        
        throw new Error(error.message || 'Falha na comunicação com o agente');
      }

      console.log('Edge function response received:', data);
      
      // **Verificar se há resposta válida**
      if (!data || !data.response) {
        throw new Error('Resposta inválida do agente');
      }
      
      // **Mostrar feedback sobre tokens usados**
      if (data.tokensUsed) {
        const remainingTokens = data.tokensRemaining || 0;
        
        if (remainingTokens < 1000) {
          toast.warning(`💬 Resposta gerada! (${data.tokensUsed} tokens usados)`, {
            description: `⚠️ Atenção: Restam apenas ${remainingTokens} tokens. Considere economizar.`,
            duration: 6000,
          });
        } else if (data.tokensUsed > 500) {
          toast.info(`💬 Resposta gerada! (${data.tokensUsed} tokens usados)`, {
            description: `Restam ${remainingTokens.toLocaleString()} tokens disponíveis.`,
            duration: 4000,
          });
        } else {
          toast.success(`💬 Resposta gerada! (${data.tokensUsed} tokens usados)`, {
            duration: 3000,
          });
        }
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => {
        const updated = [...prev, assistantMessage];
        saveToStorage(updated);
        return updated;
      });
    } catch (error) {
      console.error('=== SEND MESSAGE ERROR ===');
      console.error('Erro ao enviar mensagem:', error);
      
      // Verificar se é erro de tokens
      if (error.message?.includes('tokens') || error.message?.includes('402')) {
        toast.error('❌ Tokens Insuficientes!', {
          description: 'Você não tem tokens suficientes para esta operação.',
          duration: 6000,
        });
      } else if (error.message?.includes('ambiente') || error.message?.includes('configuração')) {
        toast.error('❌ Problema de Configuração!', {
          description: 'Há um problema na configuração do sistema. Tente novamente em alguns minutos.',
          duration: 6000,
        });
      } else {
        toast.error('❌ Erro no Chat', {
          description: 'Erro ao enviar mensagem. Verifique sua conexão e tente novamente.',
          duration: 5000,
        });
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: error.message?.includes('tokens') 
          ? '❌ **Tokens Insuficientes**\n\nDesculpe, você não tem tokens suficientes para continuar o chat. Seus tokens serão renovados no início do próximo mês.'
          : error.message?.includes('configuração') || error.message?.includes('ambiente')
          ? '❌ **Problema de Configuração**\n\nDesculpe, há um problema temporário na configuração do sistema. Tente novamente em alguns minutos.'
          : '❌ **Erro Temporário**\n\nDesculpe, ocorreu um erro ao processar sua mensagem. Verifique sua conexão e tente novamente.',
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => {
        const updated = [...prev, errorMessage];
        saveToStorage(updated);
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, saveToStorage, triggerWebhook, user?.id]);

  const clearChat = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(`chat-${agentId}`);
  }, [agentId]);

  const exportChat = useCallback((agentName: string) => {
    const chatContent = messages.map(msg => 
      `${msg.role === 'user' ? 'Você' : agentName}: ${msg.content}`
    ).join('\n\n');
    
    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversa-${agentName}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [messages]);

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
    exportChat
  };
};
