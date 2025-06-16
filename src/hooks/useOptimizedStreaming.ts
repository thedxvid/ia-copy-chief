
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
  const connectionAttemptRef = useRef(0);
  const maxConnectionAttempts = 3;

  const updateState = useCallback((updates: Partial<StreamingState>) => {
    if (mountedRef.current) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      debugLog('DISCONNECT', `Fechando conexão SSE para Agente ID: ${agentId}`);
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    updateState({ isConnected: false, connectionStatus: 'disconnected', isTyping: false });
  }, [agentId, updateState]);

  const connect = useCallback(() => {
    if (!user?.id || !agentId) {
      debugLog('CONNECT_SKIP', 'Skipping connection - missing user or agent', { 
        hasUser: !!user?.id, 
        hasAgent: !!agentId 
      });
      return;
    }

    if (eventSourceRef.current) {
      debugLog('CONNECT_SKIP', 'Connection already exists');
      return;
    }

    if (connectionAttemptRef.current >= maxConnectionAttempts) {
      debugLog('CONNECT_SKIP', 'Max connection attempts reached');
      updateState({ connectionStatus: 'error' });
      return;
    }

    connectionAttemptRef.current++;
    debugLog('CONNECT', `Iniciando conexão para Agente ID: ${agentId} (tentativa ${connectionAttemptRef.current})`);
    updateState({ connectionStatus: 'connecting' });

    const url = new URL(`https://dcnjjhavlvotzpwburvw.supabase.co/functions/v1/streaming-chat`);
    url.searchParams.set('userId', user.id);
    url.searchParams.set('agentId', agentId);
    
    const newEventSource = new EventSource(url.toString());
    eventSourceRef.current = newEventSource;

    // Timeout de conexão
    const connectionTimeout = setTimeout(() => {
      if (eventSourceRef.current && state.connectionStatus === 'connecting') {
        debugLog('CONNECTION_TIMEOUT', 'Timeout na conexão');
        disconnect();
        updateState({ connectionStatus: 'error' });
      }
    }, 10000);

    newEventSource.onopen = () => {
      debugLog('SSE_OPEN', '✅ Conexão EventSource ABERTA', { agentId });
      clearTimeout(connectionTimeout);
    };

    newEventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        debugLog('SSE_MESSAGE', 'Mensagem recebida', { type: data.type, agentId });

        switch (data.type) {
          case 'connection_established':
            debugLog('CONNECTION_ESTABLISHED', '✅ Conexão CONFIRMADA pelo servidor', data);
            updateState({ isConnected: true, connectionStatus: 'connected' });
            connectionAttemptRef.current = 0; // Reset counter on success
            clearTimeout(connectionTimeout);
            break;

          case 'ping':
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
        debugLog('SSE_ERROR', 'Erro ao processar mensagem SSE', { error, data: event.data });
      }
    };

    newEventSource.onerror = (error) => {
      debugLog('SSE_ERROR', '❌ Erro na conexão EventSource', { agentId, error });
      clearTimeout(connectionTimeout);
      updateState({ isConnected: false, connectionStatus: 'error', isTyping: false });
      newEventSource.close();
      eventSourceRef.current = null;
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
    connectionAttemptRef.current = 0; // Reset attempts for manual reconnect
    disconnect();
    setTimeout(() => {
      if (mountedRef.current) {
        connect();
      }
    }, 1000);
  }, [agentId, connect, disconnect]);

  useEffect(() => {
    mountedRef.current = true;
    if (user?.id && agentId) {
      connect();
    }
    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [user, agentId, connect, disconnect]);

  const canSendMessage = state.isConnected && state.connectionStatus === 'connected' && !isSending && !state.isTyping;

  return {
    ...state,
    isSending,
    canSendMessage,
    sendMessage,
    reconnect,
  };
};
