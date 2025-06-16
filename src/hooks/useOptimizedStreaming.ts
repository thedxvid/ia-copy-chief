
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

// Pool global de conexões SSE para evitar múltiplas conexões
const connectionPool = new Map<string, {
  eventSource: EventSource;
  callbacks: Map<string, (data: any) => void>;
}>();

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
  const { user } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;
  const callbackIdRef = useRef<string>(`callback-${Date.now()}-${Math.random()}`);
  const connectingRef = useRef(false);

  const updateConnectionStatus = useCallback((status: StreamingState['connectionStatus']) => {
    setState(prev => ({ ...prev, connectionStatus: status }));
  }, []);

  // Função para conectar ao SSE com pool de conexões
  const connectToStream = useCallback(async () => {
    if (!user?.id || connectingRef.current) return;

    // CORRIGIDO: Usar sempre userId-agentId como padrão
    const streamKey = `${user.id}-${agentId}`;
    
    // Verificar se já existe conexão ativa
    if (connectionPool.has(streamKey)) {
      const existingConnection = connectionPool.get(streamKey)!;
      
      // Registrar callback para esta instância
      existingConnection.callbacks.set(callbackIdRef.current, (data) => {
        handleSSEMessage(data);
      });
      
      updateConnectionStatus('connected');
      setState(prev => ({ ...prev, isConnected: true }));
      reconnectAttemptsRef.current = 0;
      console.log('🔗 Reutilizando conexão SSE existente para agente:', agentId, 'StreamKey:', streamKey);
      return;
    }

    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      updateConnectionStatus('error');
      toast.error('Falha ao conectar após várias tentativas');
      return;
    }

    connectingRef.current = true;
    updateConnectionStatus('connecting');

    try {
      const url = new URL(`https://dcnjjhavlvotzpwburvw.supabase.co/functions/v1/streaming-chat`);
      url.searchParams.set('userId', user.id);
      url.searchParams.set('agentId', agentId);

      const eventSource = new EventSource(url.toString());
      const callbacks = new Map<string, (data: any) => void>();
      
      // Registrar este callback
      callbacks.set(callbackIdRef.current, (data) => {
        handleSSEMessage(data);
      });

      // Adicionar ao pool com streamKey consistente
      connectionPool.set(streamKey, { eventSource, callbacks });

      eventSource.onopen = () => {
        updateConnectionStatus('connected');
        setState(prev => ({ ...prev, isConnected: true }));
        reconnectAttemptsRef.current = 0;
        connectingRef.current = false;
        console.log('🔗 Nova conexão SSE estabelecida para agente:', agentId, 'StreamKey:', streamKey);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Executar todos os callbacks registrados
          callbacks.forEach(callback => callback(data));
        } catch (error) {
          console.error('Error parsing stream data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource error for agent', agentId, ':', error);
        connectingRef.current = false;
        
        // Remover do pool
        connectionPool.delete(streamKey);
        
        // Notificar todos os callbacks sobre o erro
        callbacks.forEach(callback => {
          callback({ type: 'error', error: 'Connection lost' });
        });
        
        updateConnectionStatus('error');
        setState(prev => ({ ...prev, isConnected: false, isTyping: false }));
        
        reconnectAttemptsRef.current++;
        
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`🔄 Tentativa de reconexão para agente ${agentId}... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
            connectToStream();
          }, delay);
        } else {
          toast.error('Conexão perdida. Clique em "Reconectar" para tentar novamente.');
        }
      };

    } catch (error) {
      console.error('Failed to connect to stream for agent', agentId, ':', error);
      connectingRef.current = false;
      updateConnectionStatus('error');
      reconnectAttemptsRef.current++;
      toast.error('Falha ao conectar com o streaming');
    }
  }, [user?.id, agentId, updateConnectionStatus]);

  // Handler para mensagens SSE
  const handleSSEMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'connection_established':
        console.log('✅ Conexão confirmada para agente:', agentId);
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
  }, [agentId, onMessageComplete]);

  const disconnectStream = useCallback(() => {
    const streamKey = `${user?.id}-${agentId}`;
    const connection = connectionPool.get(streamKey);
    
    if (connection) {
      // Remover apenas este callback
      connection.callbacks.delete(callbackIdRef.current);
      
      // Se não há mais callbacks, fechar a conexão
      if (connection.callbacks.size === 0) {
        connection.eventSource.close();
        connectionPool.delete(streamKey);
        console.log('🔌 Conexão SSE fechada para agente:', agentId, 'StreamKey:', streamKey);
      }
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    reconnectAttemptsRef.current = 0;
    connectingRef.current = false;

    setState(prev => ({ 
      ...prev, 
      isConnected: false, 
      connectionStatus: 'disconnected',
      isTyping: false,
      currentStreamingMessage: '',
      currentMessageId: null
    }));
  }, [user?.id, agentId]);

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

    // CORRIGIDO: Verificar se há conexão ativa antes de enviar
    const streamKey = `${user.id}-${agentId}`;
    const streamData = connectionPool.get(streamKey);

    if (!streamData) {
      console.warn(`⚠️ Tentando reconectar para ${streamKey}...`);
      toast.error('Conexão perdida. Reconectando...');
      await connectToStream();
      
      // Aguardar um pouco para a conexão se estabelecer
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const retryStreamData = connectionPool.get(streamKey);
      if (!retryStreamData) {
        toast.error('Falha ao reconectar. Tente novamente.');
        return;
      }
    }

    setIsSending(true);

    try {
      // Abortar requisição anterior se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

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
          streamKey // Usar streamKey consistente
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Mensagem enviada com sucesso para agente:', agentId, 'StreamKey:', streamKey);

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request aborted for agent:', agentId);
        return;
      }

      console.error('❌ Erro ao enviar mensagem para agente', agentId, ':', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar mensagem';
      toast.error(errorMessage);
      throw error;

    } finally {
      setIsSending(false);
      abortControllerRef.current = null;
    }
  }, [user?.id, isSending, agentId, connectToStream]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    disconnectStream();
    setTimeout(() => connectToStream(), 1000);
  }, [connectToStream, disconnectStream]);

  // Auto-conectar com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      connectToStream();
    }, 500); // Debounce de 500ms

    return () => {
      clearTimeout(timer);
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
