
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
      const response = await fetch('/functions/v1/chat-with-claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          message,
          agent_prompt: agentPrompt,
          agent_name: agentName,
          user_id: user.id,
          is_custom_agent: isCustomAgent,
          stream: enableStreaming
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro na requisição');
      }

      if (enableStreaming && response.body) {
        // Handle Server-Sent Events (SSE) streaming
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  setIsStreaming(false);
                  // Add final assistant message
                  const assistantMessage: Message = {
                    id: `assistant-${Date.now()}-${Math.random()}`,
                    role: 'assistant',
                    content: fullContent,
                    timestamp: new Date()
                  };
                  setMessages(prev => [...prev, assistantMessage]);
                  setStreamingContent('');
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    fullContent += parsed.content;
                    setStreamingContent(fullContent);
                  }
                } catch (e) {
                  // Ignore JSON parse errors for streaming
                }
              }
            }
          }
        } catch (streamError) {
          console.error('Streaming error:', streamError);
          setIsStreaming(false);
          throw streamError;
        }
      } else {
        // Handle regular JSON response
        const data = await response.json();
        
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}-${Math.random()}`,
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
      }

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
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
