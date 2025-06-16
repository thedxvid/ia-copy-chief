
import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface StreamingState {
  messages: Message[];
  isConnected: boolean;
  isTyping: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export const useSimpleStreamingChat = (agentId: string) => {
  const [state, setState] = useState<StreamingState>({
    messages: [],
    isConnected: false,
    isTyping: false,
    connectionStatus: 'disconnected'
  });
  
  const [isSending, setIsSending] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { user } = useAuth();
  const mountedRef = useRef(true);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connectToStream = useCallback(async () => {
    if (!user?.id || eventSourceRef.current) return;

    console.log(`🔗 Conectando ao stream para agente: ${agentId}`);
    setState(prev => ({ ...prev, connectionStatus: 'connecting' }));

    try {
      const url = new URL(`https://dcnjjhavlvotzpwburvw.supabase.co/functions/v1/streaming-chat`);
      url.searchParams.set('userId', user.id);
      url.searchParams.set('agentId', agentId);

      const eventSource = new EventSource(url.toString());
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('✅ Conexão SSE estabelecida');
        if (mountedRef.current) {
          setState(prev => ({ 
            ...prev, 
            isConnected: true, 
            connectionStatus: 'connected' 
          }));
        }
      };

      eventSource.onmessage = (event) => {
        if (!mountedRef.current) return;
        
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Evento recebido:', data.type);
          
          switch (data.type) {
            case 'connection_established':
              console.log('✅ Conexão confirmada pelo servidor');
              break;

            case 'message_start':
              setState(prev => ({
                ...prev,
                isTyping: true,
                messages: [...prev.messages, {
                  id: data.messageId,
                  role: 'assistant',
                  content: '',
                  timestamp: new Date(),
                  isStreaming: true
                }]
              }));
              break;

            case 'content_delta':
              setState(prev => ({
                ...prev,
                messages: prev.messages.map(msg => 
                  msg.id === data.messageId 
                    ? { ...msg, content: data.content }
                    : msg
                )
              }));
              break;

            case 'message_complete':
              setState(prev => ({
                ...prev,
                isTyping: false,
                messages: prev.messages.map(msg => 
                  msg.id === data.messageId 
                    ? { ...msg, content: data.content, isStreaming: false }
                    : msg
                )
              }));
              break;
          }
        } catch (error) {
          console.error('Erro ao processar evento SSE:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ Erro na conexão SSE:', error);
        if (mountedRef.current) {
          setState(prev => ({ 
            ...prev, 
            isConnected: false, 
            connectionStatus: 'error',
            isTyping: false 
          }));
        }
        
        eventSource.close();
        eventSourceRef.current = null;
        
        // Tentar reconectar após 3 segundos
        if (mountedRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              console.log('🔄 Tentando reconectar...');
              connectToStream();
            }
          }, 3000);
        }
      };

    } catch (error) {
      console.error('Falha ao conectar:', error);
      if (mountedRef.current) {
        setState(prev => ({ ...prev, connectionStatus: 'error' }));
        toast.error('Falha ao conectar com o streaming');
      }
    }
  }, [user?.id, agentId]);

  const sendMessage = useCallback(async (
    message: string,
    agentPrompt: string,
    agentName: string,
    isCustomAgent: boolean = false
  ) => {
    if (!user?.id || !message.trim() || isSending || !state.isConnected) {
      return;
    }

    const messageId = `user-${Date.now()}`;
    setIsSending(true);

    try {
      // Adicionar mensagem do usuário
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          id: messageId,
          role: 'user',
          content: message,
          timestamp: new Date()
        }]
      }));

      console.log('📤 Enviando mensagem:', { agentName, messageLength: message.length });

      const response = await fetch('https://dcnjjhavlvotzpwburvw.supabase.co/functions/v1/streaming-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          message,
          agentPrompt,
          agentName,
          isCustomAgent,
          userId: user.id,
          sessionId: `session-${agentId}`,
          agentId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      console.log('✅ Mensagem enviada com sucesso');

    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      
      // Remover mensagem do usuário em caso de erro
      setState(prev => ({
        ...prev,
        messages: prev.messages.filter(msg => msg.id !== messageId)
      }));

      const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar mensagem';
      toast.error(errorMessage);
      throw error;

    } finally {
      setIsSending(false);
    }
  }, [user?.id, isSending, state.isConnected, agentId]);

  const clearChat = useCallback(() => {
    setState(prev => ({ ...prev, messages: [] }));
    toast.success('Chat limpo com sucesso!');
  }, []);

  const reconnect = useCallback(() => {
    console.log('🔄 Reconexão manual iniciada');
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setState(prev => ({ ...prev, connectionStatus: 'disconnected', isConnected: false }));
    setTimeout(() => connectToStream(), 1000);
  }, [connectToStream]);

  // Auto-conectar
  useEffect(() => {
    mountedRef.current = true;
    connectToStream();
    
    return () => {
      mountedRef.current = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectToStream]);

  return {
    messages: state.messages,
    isConnected: state.isConnected,
    isTyping: state.isTyping,
    isSending,
    connectionStatus: state.connectionStatus,
    sendMessage,
    clearChat,
    reconnect
  };
};
