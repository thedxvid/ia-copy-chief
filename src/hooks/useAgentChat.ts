
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const useAgentChat = (agentId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const { user } = useAuth();

  const sendMessage = useCallback(async (
    message: string,
    agentPrompt: string,
    agentName: string,
    isCustomAgent: boolean = false,
    enableStreaming: boolean = true
  ) => {
    if (!user?.id) {
      toast.error('Você precisa estar logado');
      return;
    }

    console.log('🚀 Enviando mensagem:', {
      message: message.substring(0, 50) + '...',
      agentName,
      isCustomAgent,
      enableStreaming,
      userId: user.id
    });

    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsStreaming(enableStreaming);
    setStreamingContent('');

    try {
      const requestBody = {
        message,
        agentPrompt,
        agentName,
        userId: user.id,
        isCustomAgent,
        streaming: enableStreaming
      };

      console.log('📡 Request body enviado:', requestBody);

      // Usar o cliente Supabase para chamar a edge function
      const { data, error } = await supabase.functions.invoke('chat-with-claude', {
        body: requestBody
      });

      console.log('📥 Response data:', data);
      console.log('📥 Response error:', error);

      if (error) {
        console.error('❌ Error response:', error);
        throw new Error(error.message || 'Erro na requisição');
      }

      if (!data) {
        throw new Error('Resposta vazia do servidor');
      }

      // Para streaming, o Supabase client não suporta SSE diretamente
      // Então vamos fazer fallback para resposta normal
      if (data.response) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}-${Math.random()}`,
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        console.log('✅ Mensagem adicionada com sucesso');
      } else {
        console.error('❌ Resposta sem conteúdo:', data);
        throw new Error('Resposta sem conteúdo válido');
      }

    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar mensagem';
      
      if (errorMessage.includes('Tokens insuficientes')) {
        toast.error('❌ Tokens Insuficientes!', {
          description: 'Você não tem tokens suficientes para conversar com o agente.',
        });
      } else {
        toast.error('❌ Erro no Chat', {
          description: errorMessage,
        });
      }

      // Remove the user message if there was an error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingContent('');
    }
  }, [user?.id]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setStreamingContent('');
    toast.success('Chat limpo com sucesso!');
  }, []);

  const exportChat = useCallback((agentName: string) => {
    if (messages.length === 0) {
      toast.error('Não há mensagens para exportar');
      return;
    }

    const chatContent = messages.map(msg => {
      const time = msg.timestamp.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      const role = msg.role === 'user' ? 'Você' : agentName;
      return `[${time}] ${role}: ${msg.content}`;
    }).join('\n\n');

    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${agentName}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Chat exportado com sucesso!');
  }, [messages]);

  return {
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    sendMessage,
    clearChat,
    exportChat,
  };
};
