
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

const debugLog = (category: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🔍 ${category}: ${message}`, data || '');
};

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
  const eventSourceRef = useRef<EventSource | null>(null);
  const mountedRef = useRef(true);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionAttemptRef = useRef(0);

  const updateState = useCallback((updates: Partial<StreamingState>) => {
    if (mountedRef.current) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      debugLog('DISCONNECT', `Fechando conexão para Agente ID: ${agentId}`);
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    updateState({ 
      isConnected: false, 
      connectionStatus: 'disconnected',
      isTyping: false,
      currentStreamingMessage: '',
      currentMessageId: null
    });
  }, [agentId, updateState]);

  const connect = useCallback(() => {
    if (!user?.id || !agentId || eventSourceRef.current) {
      return;
    }

    // Limitar tentativas de reconexão
    connectionAttemptRef.current += 1;
    if (connectionAttemptRef.current > 5) {
      debugLog('CONNECT_LIMIT', 'Muitas tentativas de conexão. Parando.');
      updateState({ connectionStatus: 'error' });
      return;
    }
    
    debugLog('CONNECT', `Tentando conectar para Agente ID: ${agentId} (tentativa ${connectionAttemptRef.current})`);
    updateState({ connectionStatus: 'connecting' });

    const url = new URL(`https://dcnjjhavlvotzpwburvw.supabase.co/functions/v1/streaming-chat`);
    url.searchParams.set('userId', user.id);
    url.searchParams.set('agentId', agentId);
    
    const newEventSource = new EventSource(url.toString());
    eventSourceRef.current = newEventSource;

    const connectionTimeout = setTimeout(() => {
      if (eventSourceRef.current === newEventSource && state.connectionStatus === 'connecting') {
        debugLog('CONNECTION_TIMEOUT', 'Timeout na conexão SSE');
        newEventSource.close();
        eventSourceRef.current = null;
        updateState({ connectionStatus: 'error' });
      }
    }, 10000); // 10 segundos timeout

    newEventSource.onopen = () => {
      clearTimeout(connectionTimeout);
      debugLog('SSE_OPEN', 'Conexão SSE aberta com sucesso.', { agentId });
    };

    newEventSource.onmessage = (event) => {
      if (!mountedRef.current) return;
      
      try {
        const data = JSON.parse(event.data);
        debugLog('SSE_MESSAGE', 'Mensagem SSE recebida', data);

        switch (data.type) {
          case 'connection_established':
            clearTimeout(connectionTimeout);
            connectionAttemptRef.current = 0; // Reset contador em conexão bem-sucedida
            updateState({ isConnected: true, connectionStatus: 'connected' });
            debugLog('CONNECTION_ESTABLISHED', 'Conexão confirmada pelo servidor.', data);
            break;

          case 'ping':
            // Apenas confirmar que a conexão está viva
            debugLog('PING_RECEIVED', 'Ping recebido do servidor');
            break;

          case 'message_start':
            updateState({
              isTyping: true,
              currentMessageId: data.messageId,
              currentStreamingMessage: ''
            });
            debugLog('MESSAGE_START', 'Início de mensagem streaming', { messageId: data.messageId });
            break;

          case 'content_delta':
            if (data.messageId === state.currentMessageId) {
              updateState({ currentStreamingMessage: data.content });
            }
            break;

          case 'message_complete':
            updateState({ 
              isTyping: false,
              currentStreamingMessage: '',
              currentMessageId: null
            });
            onMessageComplete(data.messageId, data.content);
            debugLog('MESSAGE_COMPLETE', 'Mensagem streaming finalizada', { messageId: data.messageId });
            break;
        }
      } catch (error) {
        debugLog('SSE_PARSE_ERROR', 'Erro ao processar mensagem SSE', { error, data: event.data });
      }
    };

    newEventSource.onerror = (error) => {
      clearTimeout(connectionTimeout);
      debugLog('SSE_ERROR', 'Erro na conexão SSE', error);
      
      newEventSource.close();
      eventSourceRef.current = null;
      
      if (mountedRef.current) {
        updateState({ isConnected: false, connectionStatus: 'error', isTyping: false });
        
        // Tentar reconectar após delay crescente
        if (connectionAttemptRef.current <= 3) {
          const delay = Math.min(1000 * Math.pow(2, connectionAttemptRef.current), 10000);
          debugLog('RECONNECT_SCHEDULED', `Reconexão agendada em ${delay}ms`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connect();
            }
          }, delay);
        }
      }
    };

  }, [user?.id, agentId, updateState, onMessageComplete, state.currentMessageId, state.connectionStatus]);

  const sendMessage = useCallback(async (
    sessionId: string,
    message: string,
    agentPrompt: string,
    agentName: string,
    isCustomAgent: boolean = false
  ) => {
    if (!user?.id || !state.isConnected || isSending) {
      debugLog('SEND_BLOCKED', 'Envio bloqueado', { 
        isConnected: state.isConnected, 
        isSending,
        hasUser: !!user?.id
      });
      toast.error('Não foi possível enviar a mensagem. Verifique a conexão.');
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch('https://dcnjjhavlvotzpwburvw.supabase.co/functions/v1/streaming-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`
        },
        body: JSON.stringify({
          message,
          agentPrompt,
          agentName,
          isCustomAgent,
          userId: user.id,
          sessionId,
          agentId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      debugLog('SEND_SUCCESS', 'Mensagem enviada com sucesso', result);

    } catch (error) {
      debugLog('SEND_ERROR', 'Erro ao enviar mensagem', error);
      toast.error('Falha ao enviar mensagem: ' + (error instanceof Error ? error.message : String(error)));
      throw error;
    } finally {
      setIsSending(false);
    }
  }, [user?.id, agentId, state.isConnected, isSending]);

  const reconnect = useCallback(() => {
    debugLog('MANUAL_RECONNECT', `Reconexão manual para Agente ID: ${agentId}`);
    connectionAttemptRef.current = 0; // Reset contador para reconexão manual
    disconnect();
    setTimeout(() => {
      if (mountedRef.current) {
        connect();
      }
    }, 1000);
  }, [agentId, connect, disconnect]);

  // Auto-conectar quando o hook é montado
  useEffect(() => {
    mountedRef.current = true;
    if (user?.id && agentId) {
      connect();
    }
    
    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [user?.id, agentId]); // Removido connect e disconnect das dependências para evitar loops

  const canSendMessage = state.isConnected && state.connectionStatus === 'connected' && !isSending && !state.isTyping;

  return {
    ...state,
    isSending,
    canSendMessage,
    sendMessage,
    reconnect,
  };
};
