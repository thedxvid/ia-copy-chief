import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface StreamingState {
  isConnected: boolean;
  isTyping: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  currentStreamingMessage: string;
  currentMessageId: string | null;
}

export const useOptimizedStreaming = (
  agentId: string,
  onMessageComplete: (messageId: string, content: string) => void
) => {
  const [state, setState] = useState<StreamingState>({
    isConnected: false,
    isTyping: false,
    connectionStatus: 'disconnected',
    currentStreamingMessage: '',
    currentMessageId: null
  });

  const [isSending, setIsSending] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { user } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;

  const updateConnectionStatus = useCallback((status: StreamingState['connectionStatus']) => {
    setState(prev => ({ ...prev, connectionStatus: status }));
  }, []);

  // Conectar ao SSE com streamKey corrigido
  const connectToStream = useCallback(async () => {
    if (!user?.id || eventSourceRef.current) return;

    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      updateConnectionStatus('error');
      toast.error('Falha ao conectar após várias tentativas');
      return;
    }

    updateConnectionStatus('connecting');

    try {
      // Usar agentId diretamente como streamKey para consistência
      const url = new URL(`https://dcnjjhavlvotzpwburvw.supabase.co/functions/v1/streaming-chat`);
      url.searchParams.set('userId', user.id);
      url.searchParams.set('agentId', agentId);

      const eventSource = new EventSource(url.toString());
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        updateConnectionStatus('connected');
        setState(prev => ({ ...prev, isConnected: true }));
        reconnectAttemptsRef.current = 0;
        console.log('🔗 Streaming connection established for agent:', agentId);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'connection_established':
              console.log('✅ Connection confirmed for agent:', agentId);
              break;

            case 'message_start':
              setState(prev => ({
                ...prev,
                isTyping: true,
                currentStreamingMessage: '',
                currentMessageId: data.messageId
              }));
              break;

            case 'content_delta':
              setState(prev => ({
                ...prev,
                currentStreamingMessage: data.content
              }));
              break;

            case 'message_complete':
              setState(prev => ({
                ...prev,
                isTyping: false,
                currentStreamingMessage: '',
                currentMessageId: null
              }));
              onMessageComplete(data.messageId, data.content);
              break;

            case 'ping':
              // Keep alive ping
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
        console.error('EventSource error for agent', agentId, ':', error);
        updateConnectionStatus('error');
        setState(prev => ({ ...prev, isConnected: false, isTyping: false }));
        
        eventSource.close();
        eventSourceRef.current = null;
        
        reconnectAttemptsRef.current++;
        
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`🔄 Attempting to reconnect for agent ${agentId}... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
            connectToStream();
          }, delay);
        } else {
          toast.error('Conexão perdida. Clique em "Reconectar" para tentar novamente.');
        }
      };

    } catch (error) {
      console.error('Failed to connect to stream for agent', agentId, ':', error);
      updateConnectionStatus('error');
      reconnectAttemptsRef.current++;
      toast.error('Falha ao conectar com o streaming');
    }
  }, [user?.id, agentId, updateConnectionStatus, onMessageComplete]);

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
      isTyping: false,
      currentStreamingMessage: '',
      currentMessageId: null
    }));
  }, []);

  const sendMessage = useCallback(async (
    sessionId: string,
    message: string,
    agentPrompt: string,
    agentName: string,
    isCustomAgent: boolean = false
  ) => {
    if (!user?.id || !message.trim() || isSending) {
      return;
    }

    setIsSending(true);

    try {
      // Abortar requisição anterior se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      // Enviar mensagem usando agentId como streamKey para consistência
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
          sessionId,
          streamKey: agentId // Usar agentId como streamKey
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Message sent successfully to agent:', agentId);

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request aborted for agent:', agentId);
        return;
      }

      console.error('❌ Error sending message to agent', agentId, ':', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar mensagem';
      toast.error(errorMessage);
      throw error;

    } finally {
      setIsSending(false);
      abortControllerRef.current = null;
    }
  }, [user?.id, isSending, agentId]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    disconnectStream();
    setTimeout(() => connectToStream(), 1000);
  }, [connectToStream, disconnectStream]);

  // Auto-conectar
  useEffect(() => {
    connectToStream();
    return () => {
      disconnectStream();
    };
  }, [connectToStream, disconnectStream]);

  return {
    ...state,
    isSending,
    sendMessage,
    reconnect,
    disconnect: disconnectStream
  };
};
