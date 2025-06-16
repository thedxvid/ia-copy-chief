
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

// Cleanup automático de conexões órfãs
setInterval(() => {
  const now = Date.now();
  for (const [key, connection] of connectionPool.entries()) {
    // Remove conexões inativas por mais de 5 minutos
    if (now - connection.lastActivity > 300000) {
      console.log(`🧹 Limpando conexão inativa: ${key}`);
      connection.eventSource.close();
      connectionPool.delete(key);
    }
  }
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
  const maxReconnectAttempts = 3;
  const callbackIdRef = useRef<string>(`callback-${Date.now()}-${Math.random()}`);
  const connectingRef = useRef(false);

  const updateConnectionStatus = useCallback((status: StreamingState['connectionStatus']) => {
    setState(prev => ({ ...prev, connectionStatus: status }));
  }, []);

  // CORRIGIDO: Usar sempre userId-agentId como streamKey
  const getStreamKey = useCallback(() => {
    if (!user?.id) return null;
    return `${user.id}-${agentId}`;
  }, [user?.id, agentId]);

  // Função para conectar ao SSE com validação robusta
  const connectToStream = useCallback(async () => {
    if (!user?.id || connectingRef.current) return;

    const streamKey = getStreamKey();
    if (!streamKey) return;
    
    // Verificar se já existe conexão ativa e válida
    if (connectionPool.has(streamKey)) {
      const existingConnection = connectionPool.get(streamKey)!;
      
      // Verificar se a conexão ainda está viva
      if (existingConnection.eventSource.readyState === EventSource.OPEN) {
        // Registrar callback para esta instância
        existingConnection.callbacks.set(callbackIdRef.current, handleSSEMessage);
        existingConnection.lastActivity = Date.now();
        
        if (existingConnection.isReady) {
          updateConnectionStatus('connected');
          setState(prev => ({ ...prev, isConnected: true }));
          reconnectAttemptsRef.current = 0;
          console.log('🔗 Reutilizando conexão SSE PRONTA para agente:', agentId);
          return;
        }
      } else {
        // Remover conexão morta
        console.log('🗑️ Removendo conexão morta:', streamKey);
        connectionPool.delete(streamKey);
      }
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
      url.searchParams.set('agentId', agentId); // ✅ Usar agentId, não agentName

      const eventSource = new EventSource(url.toString());
      const callbacks = new Map<string, (data: any) => void>();
      const now = Date.now();
      
      // Registrar este callback
      callbacks.set(callbackIdRef.current, handleSSEMessage);

      // Adicionar ao pool - inicialmente NÃO está pronto
      const connectionData = { 
        eventSource, 
        callbacks, 
        isReady: false,
        createdAt: now,
        lastActivity: now
      };
      connectionPool.set(streamKey, connectionData);

      eventSource.onopen = () => {
        console.log('🔗 EventSource aberto para agente:', agentId, 'StreamKey:', streamKey);
        connectingRef.current = false;
        connectionData.lastActivity = Date.now();
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          connectionData.lastActivity = Date.now();
          
          // ✅ Confirmação IMEDIATA do backend
          if (data.type === 'connection_established') {
            connectionData.isReady = true;
            updateConnectionStatus('connected');
            setState(prev => ({ ...prev, isConnected: true }));
            reconnectAttemptsRef.current = 0;
            console.log('✅ Conexão IMEDIATAMENTE pronta para agente:', agentId);
          }
          
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
  }, [user?.id, agentId, updateConnectionStatus, getStreamKey]);

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
    const streamKey = getStreamKey();
    if (!streamKey) return;

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
  }, [getStreamKey, agentId]);

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

    const streamKey = getStreamKey();
    if (!streamKey) {
      toast.error('Erro: usuário não autenticado');
      return;
    }

    const streamData = connectionPool.get(streamKey);

    // ✅ Verificação robusta e clara
    if (!streamData) {
      console.warn(`⚠️ Stream não existe para ${streamKey}`);
      toast.error('Conexão não estabelecida. Reconectando...');
      await connectToStream();
      return;
    }

    if (!streamData.isReady) {
      console.warn(`⚠️ Stream ${streamKey} não está pronto. Ready: ${streamData.isReady}`);
      toast.error('Conexão ainda não está pronta. Aguarde...');
      return;
    }

    if (streamData.eventSource.readyState !== EventSource.OPEN) {
      console.warn(`⚠️ EventSource não está aberto. Estado: ${streamData.eventSource.readyState}`);
      toast.error('Conexão perdida. Reconectando...');
      connectionPool.delete(streamKey);
      await connectToStream();
      return;
    }

    setIsSending(true);

    try {
      // Abortar requisição anterior se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      console.log('📤 Enviando mensagem para agente:', agentId, 'StreamKey:', streamKey);

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
          agentId // ✅ Incluir agentId no payload
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Mensagem enviada com sucesso para agente:', agentId);

      // Atualizar atividade do stream
      streamData.lastActivity = Date.now();

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
  }, [user?.id, isSending, agentId, getStreamKey, connectToStream]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    disconnectStream();
    setTimeout(() => connectToStream(), 1000);
  }, [connectToStream, disconnectStream]);

  // Auto-conectar com retry inteligente
  useEffect(() => {
    const timer = setTimeout(() => {
      connectToStream();
    }, 500);

    return () => {
      clearTimeout(timer);
      disconnectStream();
    };
  }, [connectToStream, disconnectStream]);

  // ✅ Status mais rigoroso para permitir envio
  const canSendMessage = state.isConnected && 
                        state.connectionStatus === 'connected' && 
                        !isSending && 
                        !state.isTyping;

  return {
    ...state,
    isSending,
    canSendMessage, // ✅ Novo campo para validação
    sendMessage,
    reconnect,
    disconnect: disconnectStream
  };
};
