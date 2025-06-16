
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
  console.log(`[${timestamp}] 🔍 STREAMING_${category}: ${message}`, data || '');
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
  const maxConnectionAttempts = 10; // Aumentado de 5 para 10
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);

  const updateState = useCallback((updates: Partial<StreamingState>) => {
    if (mountedRef.current) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  const disconnect = useCallback(() => {
    debugLog('DISCONNECT', `🔌 Fechando conexão SSE para Agente ID: ${agentId}`);
    
    isConnectingRef.current = false;
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }

    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    
    updateState({ 
      isConnected: false, 
      connectionStatus: 'disconnected', 
      isTyping: false,
      currentStreamingMessage: '',
      currentMessageId: null
    });
  }, [agentId, updateState]);

  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }
    
    heartbeatRef.current = setInterval(() => {
      if (eventSourceRef.current && state.isConnected) {
        debugLog('HEARTBEAT', '💓 Verificando conexão...');
        // Se a conexão estiver morta, o erro será capturado automaticamente
      }
    }, 20000); // Verificar a cada 20 segundos (reduzido de 30s)
  }, [state.isConnected]);

  const connect = useCallback(() => {
    if (!user?.id || !agentId) {
      debugLog('CONNECT_SKIP', '⚠️ Conexão ignorada - faltam dados', { 
        hasUser: !!user?.id, 
        hasAgent: !!agentId 
      });
      return;
    }

    if (isConnectingRef.current) {
      debugLog('CONNECT_SKIP', '⚠️ Já conectando, ignorando nova tentativa');
      return;
    }

    if (eventSourceRef.current) {
      debugLog('CONNECT_SKIP', '⚠️ Conexão já existe');
      return;
    }

    if (connectionAttemptRef.current >= maxConnectionAttempts) {
      debugLog('CONNECT_SKIP', `⚠️ Máximo de tentativas atingido (${maxConnectionAttempts})`);
      updateState({ connectionStatus: 'error' });
      toast.error('Falha na conexão após várias tentativas. Tente reconectar manualmente.');
      return;
    }

    isConnectingRef.current = true;
    connectionAttemptRef.current++;
    debugLog('CONNECT', `🔄 Iniciando conexão para Agente ID: ${agentId} (tentativa ${connectionAttemptRef.current}/${maxConnectionAttempts})`);
    updateState({ connectionStatus: 'connecting' });

    try {
      const url = new URL(`https://dcnjjhavlvotzpwburvw.supabase.co/functions/v1/streaming-chat`);
      url.searchParams.set('userId', user.id);
      url.searchParams.set('agentId', agentId);
      
      const newEventSource = new EventSource(url.toString());
      eventSourceRef.current = newEventSource;

      // Timeout de conexão aumentado
      connectionTimeoutRef.current = setTimeout(() => {
        if (isConnectingRef.current && state.connectionStatus === 'connecting') {
          debugLog('CONNECTION_TIMEOUT', '⏰ Timeout na conexão - tentando reconectar');
          isConnectingRef.current = false;
          disconnect();
          // Tentar reconectar automaticamente após timeout se ainda não atingiu o limite
          if (connectionAttemptRef.current < maxConnectionAttempts) {
            setTimeout(() => {
              if (mountedRef.current) {
                connect();
              }
            }, 3000); // Aguardar 3 segundos antes de tentar novamente
          }
        }
      }, 20000); // 20 segundos de timeout (aumentado de 15s)

      newEventSource.onopen = () => {
        debugLog('SSE_OPEN', '🔓 Conexão EventSource ABERTA', { agentId });
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
      };

      newEventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          debugLog('SSE_MESSAGE', '📨 Mensagem recebida', { type: data.type, agentId, timestamp: data.timestamp });

          switch (data.type) {
            case 'connection_established':
              debugLog('CONNECTION_ESTABLISHED', '✅ Conexão CONFIRMADA pelo servidor');
              isConnectingRef.current = false;
              connectionAttemptRef.current = 0; // Reset counter on success
              updateState({ isConnected: true, connectionStatus: 'connected' });
              if (connectionTimeoutRef.current) {
                clearTimeout(connectionTimeoutRef.current);
                connectionTimeoutRef.current = null;
              }
              startHeartbeat();
              break;

            case 'ping':
              debugLog('PING_RECEIVED', '💓 Ping recebido - conexão viva');
              break;

            case 'message_start':
              updateState({
                isTyping: true,
                currentMessageId: data.messageId,
                currentStreamingMessage: ''
              });
              debugLog('MESSAGE_START', '🚀 Início de mensagem streaming', { messageId: data.messageId });
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
              debugLog('MESSAGE_COMPLETE', '✅ Mensagem streaming finalizada', { messageId: data.messageId });
              break;

            case 'error':
              debugLog('SERVER_ERROR', '❌ Erro do servidor', data);
              toast.error(`Erro do servidor: ${data.error}`);
              break;
          }
        } catch (error) {
          debugLog('SSE_PARSE_ERROR', '❌ Erro ao processar mensagem SSE', { error, data: event.data });
        }
      };

      newEventSource.onerror = (error) => {
        debugLog('SSE_ERROR', '❌ Erro na conexão EventSource', { agentId, error, attempt: connectionAttemptRef.current });
        isConnectingRef.current = false;
        
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
          heartbeatRef.current = null;
        }
        
        updateState({ isConnected: false, isTyping: false });
        newEventSource.close();
        eventSourceRef.current = null;

        // Reconexão automática com backoff exponencial melhorado
        if (connectionAttemptRef.current < maxConnectionAttempts) {
          const baseDelay = 1000;
          const exponentialDelay = Math.min(baseDelay * Math.pow(2, connectionAttemptRef.current - 1), 15000); // Max 15s
          const jitter = Math.random() * 1000; // Adicionar jitter para evitar thundering herd
          const delay = exponentialDelay + jitter;
          
          debugLog('AUTO_RECONNECT', `🔄 Reconectando em ${Math.round(delay)}ms (tentativa ${connectionAttemptRef.current}/${maxConnectionAttempts})`);
          
          updateState({ connectionStatus: 'connecting' });
          setTimeout(() => {
            if (mountedRef.current) {
              connect();
            }
          }, delay);
        } else {
          updateState({ connectionStatus: 'error' });
          toast.error('Conexão perdida. Clique em "Reconectar" para tentar novamente.');
        }
      };

    } catch (error) {
      debugLog('CONNECTION_ERROR', '❌ Erro ao iniciar conexão', error);
      isConnectingRef.current = false;
      updateState({ connectionStatus: 'error' });
      toast.error('Falha ao conectar com o servidor de streaming');
    }
  }, [user?.id, agentId, updateState, onMessageComplete, state.currentMessageId, state.connectionStatus, startHeartbeat, disconnect]);

  const sendMessage = useCallback(async (
    sessionId: string,
    message: string,
    agentPrompt: string,
    agentName: string,
    isCustomAgent: boolean = false
  ) => {
    if (!user?.id || !state.isConnected || isSending) {
      debugLog('SEND_BLOCKED', '⚠️ Envio bloqueado', { 
        isConnected: state.isConnected, 
        isSending,
        hasUser: !!user?.id,
        connectionStatus: state.connectionStatus
      });
      
      if (!state.isConnected) {
        toast.error('Não conectado. Tentando reconectar...');
        reconnect();
      }
      return;
    }

    setIsSending(true);
    debugLog('SEND_START', '📤 Iniciando envio de mensagem', {
      messageLength: message.length,
      sessionId,
      agentName
    });

    try {
      const response = await fetch('https://dcnjjhavlvotzpwburvw.supabase.co/functions/v1/streaming-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
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
      debugLog('SEND_SUCCESS', '✅ Mensagem enviada com sucesso', result);

    } catch (error) {
      debugLog('SEND_ERROR', '❌ Erro ao enviar mensagem', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('Tokens insuficientes')) {
        toast.error('Tokens insuficientes para continuar a conversa');
      } else if (errorMessage.includes('404') || errorMessage.includes('NO_ACTIVE_STREAM')) {
        toast.error('Serviço de chat não encontrado. Verificando conexão...');
        reconnect();
      } else {
        toast.error(`Falha ao enviar mensagem: ${errorMessage}`);
      }
      throw error;
    } finally {
      setIsSending(false);
    }
  }, [user?.id, agentId, state.isConnected, isSending, state.connectionStatus]);

  const reconnect = useCallback(() => {
    debugLog('MANUAL_RECONNECT', `🔄 Reconexão manual para Agente ID: ${agentId}`);
    connectionAttemptRef.current = 0; // Reset attempts for manual reconnect
    isConnectingRef.current = false;
    disconnect();
    setTimeout(() => {
      if (mountedRef.current) {
        connect();
      }
    }, 1000);
  }, [agentId, connect, disconnect]);

  // Conectar automaticamente quando o hook é montado
  useEffect(() => {
    mountedRef.current = true;
    if (user?.id && agentId) {
      debugLog('HOOK_MOUNT', '🎯 Hook montado, iniciando conexão', { userId: user.id, agentId });
      connect();
    }
    
    return () => {
      debugLog('HOOK_UNMOUNT', '🔄 Hook desmontado, limpando conexões');
      mountedRef.current = false;
      isConnectingRef.current = false;
      disconnect();
    };
  }, [user?.id, agentId, connect, disconnect]);

  const canSendMessage = state.isConnected && state.connectionStatus === 'connected' && !isSending && !state.isTyping;

  return {
    ...state,
    isSending,
    canSendMessage,
    sendMessage,
    reconnect,
  };
};
