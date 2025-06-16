
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

// Pool global de conexões SSE otimizado com cleanup automático
const connectionPool = new Map<string, {
  eventSource: EventSource;
  callbacks: Map<string, (data: any) => void>;
  isReady: boolean;
  createdAt: number;
  lastActivity: number;
}>();

// 🔍 DEBUG: Função para logging detalhado
const debugLog = (category: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] 🔍 ${category}: ${message}`;
  console.log(logMessage, data || '');
};

// 🔍 DEBUG: Função para verificar estado do pool
const debugPoolState = (context: string) => {
  debugLog('POOL_STATE', `${context} - Pool size: ${connectionPool.size}`);
  debugLog('POOL_KEYS', 'Available streams:', Array.from(connectionPool.keys()));
  connectionPool.forEach((connection, key) => {
    debugLog('POOL_DETAIL', `Stream ${key}:`, {
      readyState: connection.eventSource.readyState,
      isReady: connection.isReady,
      callbackCount: connection.callbacks.size,
      lastActivity: new Date(connection.lastActivity).toISOString(),
      age: Date.now() - connection.createdAt
    });
  });
};

// Cleanup automático de conexões órfãs
setInterval(() => {
  const now = Date.now();
  debugLog('CLEANUP', 'Iniciando limpeza automática');
  
  for (const [key, connection] of connectionPool.entries()) {
    const age = now - connection.lastActivity;
    if (age > 300000) { // 5 minutos
      debugLog('CLEANUP', `Removendo conexão inativa: ${key}`, { age, lastActivity: new Date(connection.lastActivity) });
      connection.eventSource.close();
      connectionPool.delete(key);
    }
  }
  
  debugPoolState('PÓS_CLEANUP');
}, 60000);

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
  const maxReconnectAttempts = 5;
  const callbackIdRef = useRef<string>(`callback-${Date.now()}-${Math.random()}`);
  const connectingRef = useRef(false);
  const connectionAttemptRef = useRef(0);
  const mountedRef = useRef(true);

  const updateConnectionStatus = useCallback((status: StreamingState['connectionStatus']) => {
    if (!mountedRef.current) return;
    debugLog('CONNECTION_STATUS', `Mudança de status: ${status}`, {
      attempt: connectionAttemptRef.current,
      reconnectAttempts: reconnectAttemptsRef.current
    });
    setState(prev => ({ ...prev, connectionStatus: status }));
  }, []);

  // 🔍 DEBUG: Função para gerar streamKey com logging
  const getStreamKey = useCallback(() => {
    if (!user?.id) {
      debugLog('STREAM_KEY_ERROR', 'ERRO: userId não disponível', { userId: user?.id });
      return null;
    }
    
    const streamKey = `${user.id}-${agentId}`;
    debugLog('STREAM_KEY_GENERATED', 'StreamKey gerado:', { 
      userId: user.id, 
      agentId, 
      streamKey,
      userIdLength: user.id.length,
      agentIdLength: agentId.length
    });
    return streamKey;
  }, [user?.id, agentId]);

  // Função para conectar ao SSE com validação robusta
  const connectToStream = useCallback(async () => {
    if (!mountedRef.current) return;
    
    connectionAttemptRef.current++;
    debugLog('CONNECT_START', `Tentativa ${connectionAttemptRef.current} de conexão`, { 
      userId: user?.id, 
      agentId, 
      connecting: connectingRef.current,
      reconnectAttempts: reconnectAttemptsRef.current,
      mounted: mountedRef.current
    });
    
    if (!user?.id || connectingRef.current) {
      debugLog('CONNECT_ABORT', 'Conexão abortada', { 
        userId: user?.id, 
        connecting: connectingRef.current,
        mounted: mountedRef.current,
        reason: !user?.id ? 'no_user' : 'already_connecting'
      });
      return;
    }

    const streamKey = getStreamKey();
    if (!streamKey) {
      debugLog('CONNECT_ERROR', 'StreamKey inválido');
      return;
    }
    
    debugPoolState('PRÉ_CONEXÃO');
    
    // Verificar se já existe conexão ativa e válida
    if (connectionPool.has(streamKey)) {
      const existingConnection = connectionPool.get(streamKey)!;
      debugLog('EXISTING_CONNECTION_CHECK', 'Verificando conexão existente:', {
        readyState: existingConnection.eventSource.readyState,
        isReady: existingConnection.isReady,
        callbackCount: existingConnection.callbacks.size,
        age: Date.now() - existingConnection.createdAt
      });
      
      // Verificar se a conexão ainda está viva
      if (existingConnection.eventSource.readyState === EventSource.OPEN) {
        // Registrar callback para esta instância
        existingConnection.callbacks.set(callbackIdRef.current, handleSSEMessage);
        existingConnection.lastActivity = Date.now();
        
        if (existingConnection.isReady && mountedRef.current) {
          updateConnectionStatus('connected');
          setState(prev => ({ ...prev, isConnected: true }));
          reconnectAttemptsRef.current = 0;
          connectionAttemptRef.current = 0;
          debugLog('CONNECTION_REUSED', 'Reutilizando conexão PRONTA', { streamKey, callbackId: callbackIdRef.current });
          return;
        } else {
          debugLog('CONNECTION_NOT_READY', 'Conexão existe mas não está pronta', { streamKey });
        }
      } else {
        debugLog('CONNECTION_DEAD_REMOVAL', 'Removendo conexão morta:', { 
          streamKey, 
          readyState: existingConnection.eventSource.readyState
        });
        connectionPool.delete(streamKey);
      }
    }

    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      debugLog('MAX_RECONNECT_REACHED', 'Máximo de tentativas atingido', { attempts: reconnectAttemptsRef.current });
      if (mountedRef.current) {
        updateConnectionStatus('error');
        setState(prev => ({ ...prev, isConnected: false }));
        toast.error('Falha ao conectar após várias tentativas. Clique em "Reconectar".');
      }
      return;
    }

    connectingRef.current = true;
    if (mountedRef.current) {
      updateConnectionStatus('connecting');
    }
    
    debugLog('SSE_CREATING', `Criando nova conexão SSE (tentativa ${connectionAttemptRef.current})`, { 
      streamKey, 
      reconnectAttempt: reconnectAttemptsRef.current + 1 
    });

    try {
      const url = new URL(`https://dcnjjhavlvotzpwburvw.supabase.co/functions/v1/streaming-chat`);
      url.searchParams.set('userId', user.id);
      url.searchParams.set('agentId', agentId);
      
      debugLog('SSE_URL_CREATED', 'URL da conexão SSE:', { url: url.toString() });

      const eventSource = new EventSource(url.toString());
      const callbacks = new Map<string, (data: any) => void>();
      const now = Date.now();
      
      // Registrar este callback
      callbacks.set(callbackIdRef.current, handleSSEMessage);
      debugLog('CALLBACK_REGISTERED', 'Callback registrado', { callbackId: callbackIdRef.current });

      // Adicionar ao pool
      const connectionData = { 
        eventSource, 
        callbacks, 
        isReady: false,
        createdAt: now,
        lastActivity: now
      };
      connectionPool.set(streamKey, connectionData);
      debugLog('POOL_ADDED', 'Conexão adicionada ao pool', { streamKey, ready: false });

      eventSource.onopen = () => {
        debugLog('SSE_OPENED', 'EventSource aberto', { 
          streamKey, 
          readyState: eventSource.readyState,
          attempt: connectionAttemptRef.current,
          mounted: mountedRef.current
        });
        connectingRef.current = false;
        connectionData.lastActivity = Date.now();
      };

      eventSource.onmessage = (event) => {
        if (!mountedRef.current) return;
        
        try {
          const data = JSON.parse(event.data);
          debugLog('SSE_MESSAGE_RECEIVED', 'Mensagem recebida', { 
            type: data.type, 
            streamKey,
            hasContent: !!data.content,
            messageId: data.messageId 
          });
          connectionData.lastActivity = Date.now();
          
          // Confirmação IMEDIATA do backend
          if (data.type === 'connection_established') {
            connectionData.isReady = true;
            if (mountedRef.current) {
              updateConnectionStatus('connected');
              setState(prev => ({ ...prev, isConnected: true }));
              reconnectAttemptsRef.current = 0;
              connectionAttemptRef.current = 0;
            }
            debugLog('CONNECTION_READY', '✅ Conexão IMEDIATAMENTE pronta', { streamKey });
          }
          
          // Executar todos os callbacks registrados
          callbacks.forEach((callback, callbackId) => {
            if (mountedRef.current) {
              debugLog('CALLBACK_EXECUTE', 'Executando callback', { callbackId, type: data.type });
              callback(data);
            }
          });
        } catch (error) {
          debugLog('SSE_PARSE_ERROR', 'Erro ao parsear dados do stream', { error, data: event.data });
        }
      };

      eventSource.onerror = (error) => {
        debugLog('SSE_ERROR', 'Erro no EventSource', { 
          streamKey, 
          error, 
          readyState: eventSource.readyState,
          attempt: connectionAttemptRef.current,
          reconnectAttempts: reconnectAttemptsRef.current,
          mounted: mountedRef.current
        });
        connectingRef.current = false;
        
        // Remover do pool
        connectionPool.delete(streamKey);
        debugLog('POOL_REMOVED_ERROR', 'Conexão removida do pool devido a erro', { streamKey });
        
        if (!mountedRef.current) return;
        
        // Notificar todos os callbacks sobre o erro
        callbacks.forEach((callback, callbackId) => {
          debugLog('ERROR_CALLBACK', 'Notificando callback sobre erro', { callbackId });
          callback({ type: 'error', error: 'Connection lost' });
        });
        
        updateConnectionStatus('error');
        setState(prev => ({ ...prev, isConnected: false, isTyping: false }));
        
        reconnectAttemptsRef.current++;
        
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          const delay = Math.min(Math.pow(2, reconnectAttemptsRef.current) * 1000, 10000); // Cap at 10s
          debugLog('RECONNECT_SCHEDULE', 'Agendando reconexão', { 
            attempt: reconnectAttemptsRef.current, 
            delay, 
            streamKey 
          });
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              debugLog('RECONNECT_ATTEMPT', 'Executando tentativa de reconexão', { 
                attempt: reconnectAttemptsRef.current, 
                streamKey 
              });
              connectToStream();
            }
          }, delay);
        } else {
          debugLog('RECONNECT_FAILED', 'Falha definitiva na reconexão', { 
            streamKey, 
            totalAttempts: reconnectAttemptsRef.current 
          });
          toast.error('Conexão perdida. Clique em "Reconectar" para tentar novamente.');
        }
      };

    } catch (error) {
      debugLog('CONNECT_EXCEPTION', 'Exceção ao conectar', { error, streamKey });
      connectingRef.current = false;
      if (mountedRef.current) {
        updateConnectionStatus('error');
        reconnectAttemptsRef.current++;
        toast.error('Falha ao conectar com o streaming');
      }
    }
  }, [user?.id, agentId, updateConnectionStatus, getStreamKey]);

  // Handler para mensagens SSE
  const handleSSEMessage = useCallback((data: any) => {
    if (!mountedRef.current) return;
    
    debugLog('MESSAGE_HANDLE', `Processando mensagem tipo: ${data.type}`, {
      messageId: data.messageId,
      hasContent: !!data.content,
      streamKey: data.streamKey
    });
    
    switch (data.type) {
      case 'connection_established':
        debugLog('MESSAGE_CONNECTION', '✅ Conexão confirmada via mensagem', { agentId });
        break;

      case 'message_start':
        debugLog('MESSAGE_START', 'Início de streaming', { messageId: data.messageId });
        setState(prev => ({
          ...prev,
          isTyping: true,
          currentStreamingMessage: '',
          currentMessageId: data.messageId
        }));
        break;

      case 'content_delta':
        debugLog('MESSAGE_DELTA', 'Delta de conteúdo', { 
          messageId: data.messageId, 
          contentLength: data.content?.length 
        });
        setState(prev => ({
          ...prev,
          currentStreamingMessage: data.content
        }));
        break;

      case 'message_complete':
        debugLog('MESSAGE_COMPLETE', 'Streaming completo', { 
          messageId: data.messageId, 
          contentLength: data.content?.length 
        });
        setState(prev => ({
          ...prev,
          isTyping: false,
          currentStreamingMessage: '',
          currentMessageId: null
        }));
        onMessageComplete(data.messageId, data.content);
        break;

      case 'ping':
        debugLog('MESSAGE_PING', 'Keep alive ping recebido');
        break;

      case 'error':
        debugLog('MESSAGE_ERROR', 'Erro recebido via stream', { error: data.error });
        toast.error('Erro no streaming: ' + data.error);
        break;
    }
  }, [agentId, onMessageComplete]);

  const disconnectStream = useCallback(() => {
    const streamKey = getStreamKey();
    if (!streamKey) {
      debugLog('DISCONNECT_ERROR', 'StreamKey inválido para desconexão');
      return;
    }

    debugLog('DISCONNECT_START', 'Iniciando desconexão', { streamKey });
    const connection = connectionPool.get(streamKey);
    
    if (connection) {
      // Remover apenas este callback
      const removed = connection.callbacks.delete(callbackIdRef.current);
      debugLog('CALLBACK_REMOVED', 'Callback removido', { 
        callbackId: callbackIdRef.current, 
        removed, 
        remainingCallbacks: connection.callbacks.size 
      });
      
      // Se não há mais callbacks, fechar a conexão
      if (connection.callbacks.size === 0) {
        connection.eventSource.close();
        connectionPool.delete(streamKey);
        debugLog('CONNECTION_CLOSED', '🔌 Conexão SSE fechada (sem callbacks)', { streamKey });
      } else {
        debugLog('CONNECTION_KEPT', 'Conexão mantida (outros callbacks ativos)', { 
          streamKey, 
          remainingCallbacks: connection.callbacks.size 
        });
      }
    } else {
      debugLog('DISCONNECT_NOT_FOUND', 'Conexão não encontrada para desconexão', { streamKey });
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
      debugLog('RECONNECT_TIMEOUT_CLEARED', 'Timeout de reconexão limpo');
    }

    reconnectAttemptsRef.current = 0;
    connectionAttemptRef.current = 0;
    connectingRef.current = false;

    if (mountedRef.current) {
      setState(prev => ({ 
        ...prev, 
        isConnected: false, 
        connectionStatus: 'disconnected',
        isTyping: false,
        currentStreamingMessage: '',
        currentMessageId: null
      }));
    }

    debugPoolState('PÓS_DESCONEXÃO');
  }, [getStreamKey]);

  const sendMessage = useCallback(async (
    sessionId: string,
    message: string,
    agentPrompt: string,
    agentName: string,
    isCustomAgent: boolean = false
  ) => {
    debugLog('SEND_MESSAGE_START', 'Iniciando envio de mensagem', {
      sessionId,
      messageLength: message.length,
      agentName,
      agentId,
      isSending,
      userId: user?.id,
      connectionStatus: state.connectionStatus,
      isConnected: state.isConnected,
      isTyping: state.isTyping,
      mounted: mountedRef.current
    });

    if (!user?.id || !message.trim() || isSending || !mountedRef.current) {
      debugLog('SEND_VALIDATION_FAILED', 'Validação inicial falhou', {
        hasUserId: !!user?.id,
        hasMessage: !!message.trim(),
        isSending,
        mounted: mountedRef.current
      });
      return;
    }

    const streamKey = getStreamKey();
    if (!streamKey) {
      debugLog('SEND_ERROR', 'StreamKey inválido', { userId: user?.id, agentId });
      toast.error('Erro: usuário não autenticado');
      return;
    }

    debugLog('SEND_STREAMKEY_CHECK', 'Verificando streamKey para envio', { streamKey });
    const streamData = connectionPool.get(streamKey);

    // Verificação robusta e detalhada
    if (!streamData) {
      debugPoolState('SEND_NO_STREAM');
      debugLog('SEND_ERROR_NO_STREAM', '⚠️ Stream não existe', { 
        streamKey, 
        availableKeys: Array.from(connectionPool.keys()),
        poolSize: connectionPool.size
      });
      toast.error('Conexão não estabelecida. Reconectando...');
      await connectToStream();
      return;
    }

    if (!streamData.isReady) {
      debugLog('SEND_ERROR_NOT_READY', '⚠️ Stream não está pronto', { 
        streamKey, 
        isReady: streamData.isReady,
        readyState: streamData.eventSource.readyState
      });
      toast.error('Conexão ainda não está pronta. Aguarde...');
      return;
    }

    if (streamData.eventSource.readyState !== EventSource.OPEN) {
      debugLog('SEND_ERROR_NOT_OPEN', '⚠️ EventSource não está aberto', { 
        streamKey, 
        readyState: streamData.eventSource.readyState
      });
      toast.error('Conexão perdida. Reconectando...');
      connectionPool.delete(streamKey);
      await connectToStream();
      return;
    }

    debugLog('SEND_VALIDATION_OK', '✅ Todas as validações passaram', {
      streamKey,
      streamExists: !!streamData,
      isReady: streamData.isReady,
      readyState: streamData.eventSource.readyState
    });

    setIsSending(true);

    try {
      // Abortar requisição anterior se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        debugLog('SEND_ABORT_PREVIOUS', 'Requisição anterior abortada');
      }

      abortControllerRef.current = new AbortController();

      debugLog('SEND_HTTP_REQUEST', '📤 Enviando requisição HTTP', {
        sessionId,
        agentId,
        streamKey,
        messageLength: message.length
      });

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
          agentId
        }),
        signal: abortControllerRef.current.signal
      });

      debugLog('SEND_HTTP_RESPONSE', 'Resposta HTTP recebida', {
        status: response.status,
        ok: response.ok,
        streamKey
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        debugLog('SEND_HTTP_ERROR', 'Erro na resposta HTTP', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      debugLog('SEND_SUCCESS', '✅ Mensagem enviada com sucesso', { streamKey, agentId });

      // Atualizar atividade do stream
      streamData.lastActivity = Date.now();

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        debugLog('SEND_ABORTED', 'Envio abortado pelo usuário', { streamKey });
        return;
      }

      debugLog('SEND_EXCEPTION', '❌ Erro ao enviar mensagem', {
        error: error instanceof Error ? error.message : String(error),
        streamKey,
        agentId
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar mensagem';
      if (mountedRef.current) {
        toast.error(errorMessage);
      }
      throw error;

    } finally {
      if (mountedRef.current) {
        setIsSending(false);
      }
      abortControllerRef.current = null;
      debugLog('SEND_COMPLETE', 'Envio finalizado', { streamKey });
    }
  }, [user?.id, isSending, agentId, getStreamKey, connectToStream, state.connectionStatus, state.isConnected, state.isTyping]);

  const reconnect = useCallback(() => {
    debugLog('RECONNECT_MANUAL', 'Reconexão manual iniciada');
    reconnectAttemptsRef.current = 0;
    connectionAttemptRef.current = 0;
    disconnectStream();
    setTimeout(() => {
      if (mountedRef.current) {
        debugLog('RECONNECT_DELAYED', 'Executando reconexão após delay');
        connectToStream();
      }
    }, 1000);
  }, [connectToStream, disconnectStream]);

  // Auto-conectar com retry inteligente
  useEffect(() => {
    debugLog('HOOK_INIT', 'useOptimizedStreaming inicializado', { agentId, userId: user?.id });
    mountedRef.current = true;
    
    const timer = setTimeout(() => {
      if (mountedRef.current) {
        debugLog('HOOK_AUTO_CONNECT', 'Iniciando auto-conexão');
        connectToStream();
      }
    }, 500);

    return () => {
      debugLog('HOOK_CLEANUP', 'Limpando hook', { agentId });
      mountedRef.current = false;
      clearTimeout(timer);
      disconnectStream();
    };
  }, [connectToStream, disconnectStream, agentId]);

  // Status mais rigoroso para permitir envio
  const canSendMessage = state.isConnected && 
                        state.connectionStatus === 'connected' && 
                        !isSending && 
                        !state.isTyping &&
                        mountedRef.current;

  debugLog('HOOK_STATE_CHECK', 'Estado atual do hook', {
    isConnected: state.isConnected,
    connectionStatus: state.connectionStatus,
    isSending,
    isTyping: state.isTyping,
    canSendMessage,
    agentId,
    connectionAttempt: connectionAttemptRef.current,
    reconnectAttempts: reconnectAttemptsRef.current,
    mounted: mountedRef.current
  });

  return {
    ...state,
    isSending,
    canSendMessage,
    sendMessage,
    reconnect,
    disconnect: disconnectStream
  };
};
