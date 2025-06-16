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

interface StreamingChatState {
  messages: Message[];
  isConnected: boolean;
  isTyping: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export const useStreamingChat = (agentId: string) => {
  const [state, setState] = useState<StreamingChatState>({
    messages: [],
    isConnected: false,
    isTyping: false,
    connectionStatus: 'disconnected'
  });
  
  const [isSending, setIsSending] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { user } = useAuth();
  const lastMessageIdRef = useRef<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;

  // Debounce para prevenir envios múltiplos
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const updateConnectionStatus = useCallback((status: StreamingChatState['connectionStatus']) => {
    setState(prev => ({ ...prev, connectionStatus: status }));
  }, []);

  const addMessage = useCallback((message: Omit<Message, 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      timestamp: new Date()
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));

    return newMessage.id;
  }, []);

  const updateStreamingMessage = useCallback((messageId: string, content: string, isComplete: boolean = false) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(msg => 
        msg.id === messageId 
          ? { ...msg, content, isStreaming: !isComplete }
          : msg
      )
    }));
  }, []);

  const connectToStream = useCallback(async () => {
    if (!user?.id || eventSourceRef.current) return;

    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      updateConnectionStatus('error');
      toast.error('Falha ao conectar após várias tentativas');
      return;
    }

    updateConnectionStatus('connecting');

    try {
      const url = new URL(`https://dcnjjhavlvotzpwburvw.supabase.co/functions/v1/streaming-chat`);
      url.searchParams.set('userId', user.id);
      url.searchParams.set('agentId', agentId);

      const eventSource = new EventSource(url.toString());
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        updateConnectionStatus('connected');
        setState(prev => ({ ...prev, isConnected: true }));
        reconnectAttemptsRef.current = 0; // Reset counter on successful connection
        console.log('🔗 Streaming connection established');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'connection_established':
              console.log('✅ Connection confirmed');
              break;

            case 'message_start':
              const messageId = addMessage({
                id: data.messageId,
                role: 'assistant',
                content: '',
                isStreaming: true
              });
              setState(prev => ({ ...prev, isTyping: true }));
              break;

            case 'content_delta':
              updateStreamingMessage(data.messageId, data.content, false);
              break;

            case 'message_complete':
              updateStreamingMessage(data.messageId, data.content, true);
              setState(prev => ({ ...prev, isTyping: false }));
              break;

            case 'ping':
              // Keep alive ping, no action needed
              break;

            case 'error':
              console.error('Stream error:', data.error);
              toast.error('Erro no streaming: ' + data.error);
              break;
          }
        } catch (error) {
          console.error('Error parsing stream data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        updateConnectionStatus('error');
        setState(prev => ({ ...prev, isConnected: false, isTyping: false }));
        
        // Close the current connection
        eventSource.close();
        eventSourceRef.current = null;
        
        // Increment retry counter and attempt reconnection
        reconnectAttemptsRef.current++;
        
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000; // Exponential backoff
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`🔄 Attempting to reconnect... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
            connectToStream();
          }, delay);
        } else {
          toast.error('Conexão perdida. Clique em "Reconectar" para tentar novamente.');
        }
      };

    } catch (error) {
      console.error('Failed to connect to stream:', error);
      updateConnectionStatus('error');
      reconnectAttemptsRef.current++;
      toast.error('Falha ao conectar com o streaming');
    }
  }, [user?.id, agentId, addMessage, updateStreamingMessage, updateConnectionStatus]);

  const disconnectStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    reconnectAttemptsRef.current = 0;

    setState(prev => ({ 
      ...prev, 
      isConnected: false, 
      connectionStatus: 'disconnected',
      isTyping: false 
    }));
  }, []);

  const sendMessage = useCallback(async (
    message: string,
    agentPrompt: string,
    agentName: string,
    isCustomAgent: boolean = false
  ) => {
    if (!user?.id || !message.trim() || isSending) {
      return;
    }

    // Debounce para prevenir envios múltiplos
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    return new Promise<void>((resolve, reject) => {
      debounceRef.current = setTimeout(async () => {
        const messageId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        try {
          setIsSending(true);
          
          // Verificar se não é duplicata
          if (lastMessageIdRef.current === messageId) {
            console.log('⚠️ Duplicate message prevented');
            resolve();
            return;
          }
          
          lastMessageIdRef.current = messageId;

          // Adicionar mensagem do usuário imediatamente
          addMessage({
            id: messageId,
            role: 'user',
            content: message
          });

          // Abortar requisição anterior se existir
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }

          abortControllerRef.current = new AbortController();

          // Enviar mensagem para o backend
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
              messageId
            }),
            signal: abortControllerRef.current.signal
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
          }

          console.log('✅ Message sent successfully');
          resolve();

        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            console.log('Request aborted');
            resolve();
            return;
          }

          console.error('❌ Error sending message:', error);
          
          // Remover mensagem do usuário em caso de erro
          setState(prev => ({
            ...prev,
            messages: prev.messages.filter(msg => msg.id !== messageId)
          }));

          const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar mensagem';
          toast.error(errorMessage);
          reject(error);

        } finally {
          setIsSending(false);
          abortControllerRef.current = null;
        }
      }, 300); // 300ms debounce
    });
  }, [user?.id, isSending, addMessage]);

  const clearChat = useCallback(() => {
    setState(prev => ({ ...prev, messages: [] }));
    lastMessageIdRef.current = '';
    toast.success('Chat limpo com sucesso!');
  }, []);

  // Reset reconnect attempts and try to reconnect manually
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    disconnectStream();
    setTimeout(() => connectToStream(), 1000);
  }, [connectToStream, disconnectStream]);

  // Auto-conectar quando o hook é inicializado
  useEffect(() => {
    connectToStream();
    return () => {
      disconnectStream();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [connectToStream, disconnectStream]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    messages: state.messages,
    isConnected: state.isConnected,
    isTyping: state.isTyping,
    isSending,
    connectionStatus: state.connectionStatus,
    sendMessage,
    clearChat,
    reconnect,
    disconnect: disconnectStream
  };
};
