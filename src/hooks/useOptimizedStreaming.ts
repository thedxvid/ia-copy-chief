
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
    if (!user?.id || !agentId || eventSourceRef.current) {
      debugLog('CONNECT_SKIP', 'Skipping connection', { hasUser: !!user?.id, hasAgent: !!agentId, hasEventSource: !!eventSourceRef.current });
      return;
    }
    
    debugLog('CONNECT', `Iniciando nova conexão para Agente ID: ${agentId}`);
    updateState({ connectionStatus: 'connecting' });

    const url = new URL(`https://dcnjjhavlvotzpwburvw.supabase.co/functions/v1/streaming-chat`);
    url.searchParams.set('userId', user.id);
    url.searchParams.set('agentId', agentId);
    
    const newEventSource = new EventSource(url.toString());
    eventSourceRef.current = newEventSource;

    newEventSource.onopen = () => {
      debugLog('SSE_OPEN', '✅ Conexão EventSource ABERTA com sucesso.', { agentId });
      // A confirmação real vem da mensagem 'connection_established'
    };

    newEventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        debugLog('SSE_MESSAGE', 'Mensagem recebida', { type: data.type, agentId });

        switch (data.type) {
          case 'connection_established':
            debugLog('CONNECTION_ESTABLISHED', '✅ Conexão CONFIRMADA pelo servidor.', data);
            updateState({ isConnected: true, connectionStatus: 'connected' });
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
      debugLog('SSE_ERROR', '❌ Ocorreu um ERRO na conexão EventSource.', { agentId, error });
      updateState({ isConnected: false, connectionStatus: 'error', isTyping: false });
      newEventSource.close();
      eventSourceRef.current = null;
    };

  }, [user?.id, agentId, updateState, onMessageComplete, state.currentMessageId]);

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
