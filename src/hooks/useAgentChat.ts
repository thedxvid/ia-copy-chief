
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
      userId: user.id,
      agentId
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

      console.log('📡 Enviando request para edge function:', {
        ...requestBody,
        message: requestBody.message.substring(0, 50) + '...',
        agentPrompt: requestBody.agentPrompt.substring(0, 50) + '...'
      });

      // Usar o cliente Supabase para chamar a edge function
      const { data, error } = await supabase.functions.invoke('chat-with-claude', {
        body: requestBody
      });

      console.log('📥 Resposta da edge function:', {
        data: data ? Object.keys(data) : 'null',
        error: error ? error.message : 'null',
        hasResponse: !!data?.response,
        dataType: typeof data
      });

      // Validação detalhada da resposta
      if (error) {
        console.error('❌ Erro da edge function:', error);
        throw new Error(error.message || 'Erro na comunicação com o servidor');
      }

      if (!data) {
        console.error('❌ Resposta vazia da edge function');
        throw new Error('Resposta vazia do servidor. Verifique se a função está configurada corretamente.');
      }

      // Verificar diferentes formatos de resposta possíveis
      let assistantResponse = '';
      
      if (data.response) {
        assistantResponse = data.response;
      } else if (data.message) {
        assistantResponse = data.message;
      } else if (data.content) {
        assistantResponse = data.content;
      } else if (typeof data === 'string') {
        assistantResponse = data;
      } else {
        console.error('❌ Formato de resposta inesperado:', data);
        throw new Error('Formato de resposta inválido. A IA não conseguiu processar sua mensagem.');
      }

      if (!assistantResponse || assistantResponse.trim() === '') {
        console.error('❌ Resposta da IA vazia');
        throw new Error('A IA retornou uma resposta vazia. Tente novamente.');
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}-${Math.random()}`,
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      console.log('✅ Mensagem da IA adicionada com sucesso:', {
        length: assistantResponse.length,
        preview: assistantResponse.substring(0, 100) + '...'
      });

    } catch (error) {
      console.error('❌ Erro completo ao enviar mensagem:', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : 'N/A',
        agentName,
        userId: user.id
      });

      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar mensagem';
      
      // Tratamento específico de diferentes tipos de erro
      if (errorMessage.includes('Tokens insuficientes')) {
        toast.error('❌ Tokens Insuficientes!', {
          description: 'Você não tem tokens suficientes para conversar com o agente.',
        });
      } else if (errorMessage.includes('função não encontrada') || errorMessage.includes('404')) {
        toast.error('❌ Erro de Configuração', {
          description: 'A função de chat não está configurada corretamente. Contate o suporte.',
        });
      } else if (errorMessage.includes('Resposta vazia') || errorMessage.includes('sem conteúdo')) {
        toast.error('❌ Erro de Comunicação', {
          description: 'Não foi possível obter resposta da IA. Verifique sua conexão e tente novamente.',
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
