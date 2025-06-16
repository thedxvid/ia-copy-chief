
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

  const connect = useCallback(() => {
    if (!user?.id || !agentId || eventSourceRef.current) {
      return;
    }
    
    debugLog('CONNECT', `Tentando conectar para Agente ID: ${agentId}`);
    updateState({ connectionStatus: 'connecting' });

    const url = new URL(`https://dcnjjhavlvotzpwburvw.supabase.co/functions/v1/streaming-chat`);
    url.searchParams.set('userId', user.id);
    url.searchParams.set('agentId', agentId);
    
    const newEventSource = new EventSource(url.toString());
    eventSourceRef.current = newEventSource;

    newEventSource.onopen = () => {
      debugLog('SSE_OPEN', 'Conexão SSE aberta com sucesso.', { agentId });
    };

    newEventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        debugLog('SSE_MESSAGE', 'Mensagem SSE recebida', data);

        switch (data.type) {
          case 'connection_established':
            updateState({ isConnected: true, connectionStatus: 'connected' });
            debugLog('CONNECTION_ESTABLISHED', 'Conexão confirmada pelo servidor.', data);
            break;
          case 'message_start':
            updateState({
              isTyping: true,
              currentMessageId: data.messageId,
              currentStreamingMessage: ''
            });
            break;
          case 'content_delta':
            if (data.messageId === state.currentMessageId) {
              updateState({ currentStreamingMessage: data.content });
            }
            break;
          case 'message_complete':
            updateState({ isTyping: false });
            onMessageComplete(data.messageId, data.content);
            break;
        }
      } catch (error) {
        debugLog('SSE_ERROR', 'Erro ao processar mensagem SSE', { error, data: event.data });
      }
    };

    newEventSource.onerror = (error) => {
      debugLog('SSE_ERROR', 'Erro na conexão SSE', error);
      updateState({ isConnected: false, connectionStatus: 'error', isTyping: false });
      newEventSource.close();
      eventSourceRef.current = null;
    };

  }, [user?.id, agentId, updateState, onMessageComplete, state.currentMessageId]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      debugLog('DISCONNECT', `Fechando conexão para Agente ID: ${agentId}`);
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      updateState({ isConnected: false, connectionStatus: 'disconnected' });
    }
  }, [agentId, updateState]);

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

  const sendMessage = useCallback(async (
    sessionId: string,
    message: string,
    agentPrompt: string,
    agentName: string,
    isCustomAgent: boolean = false
  ) => {
    if (!user?.id || !state.isConnected || isSending) {
      debugLog('SEND_BLOCKED', 'Envio bloqueado', { isConnected: state.isConnected, isSending });
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
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      debugLog('SEND_ERROR', 'Erro ao enviar mensagem', error);
      toast.error('Falha ao enviar mensagem: ' + (error as Error).message);
    } finally {
      setIsSending(false);
    }
  }, [user?.id, agentId, state.isConnected, isSending]);

  const reconnect = useCallback(() => {
    debugLog('RECONNECT', `Tentando reconectar para Agente ID: ${agentId}`);
    disconnect();
    setTimeout(connect, 1000);
  }, [agentId, connect, disconnect]);

  const canSendMessage = state.isConnected && state.connectionStatus === 'connected' && !isSending && !state.isTyping;

  return {
    ...state,
    isSending,
    canSendMessage,
    sendMessage,
    reconnect,
  };
};
