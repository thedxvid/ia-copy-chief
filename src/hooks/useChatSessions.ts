
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChatSession {
  id: string;
  agent_id: string;
  agent_name: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  message_count: number;
}

interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  tokens_used: number;
  created_at: string;
  streaming_complete: boolean;
}

// Sistema de logs otimizado
const chatLogger = {
  log: (action: string, data?: any) => {
    console.log(`[CHAT] ${new Date().toISOString()} - ${action}:`, data || '');
  },
  error: (action: string, error: any) => {
    console.error(`[CHAT ERROR] ${new Date().toISOString()} - ${action}:`, error);
  }
};

export const useChatSessions = (agentId: string) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  
  // Refs para controle de estado
  const mountedRef = useRef(true);
  const currentSessionRef = useRef<ChatSession | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // FASE 4: Cache de sessões otimizado
  const sessionsCache = useRef<Map<string, ChatSession[]>>(new Map());
  const messagesCache = useRef<Map<string, ChatMessage[]>>(new Map());

  // FASE 5: Debounce para operações do banco
  const debouncedDatabaseOperation = useCallback((operation: () => Promise<void>, delay = 300) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(async () => {
      try {
        await operation();
      } catch (error) {
        chatLogger.error('DEBOUNCED_OPERATION_ERROR', error);
      }
    }, delay);
  }, []);

  // Função de validação completa do estado
  const validateChatState = useCallback(() => {
    chatLogger.log('VALIDATING_STATE', {
      currentSessionId: currentSession?.id,
      sessionsCount: sessions.length,
      messagesCount: messages.length,
      agentId,
      cacheSize: sessionsCache.current.size
    });

    const issues: string[] = [];
    
    if (!mountedRef.current) {
      issues.push('Hook não está montado');
    }

    if (currentSession && !sessions.find(s => s.id === currentSession.id)) {
      issues.push('Sessão ativa não existe na lista de sessões');
    }

    if (currentSession && messages.length > 0) {
      const hasValidMessages = messages.every(msg => msg.session_id === currentSession.id);
      if (!hasValidMessages) {
        issues.push('Mensagens não correspondem à sessão ativa');
      }
    }

    if (issues.length > 0) {
      chatLogger.error('STATE_VALIDATION_FAILED', issues);
      return false;
    }

    chatLogger.log('STATE_VALIDATION_SUCCESS');
    return true;
  }, [currentSession, sessions, messages, agentId]);

  // Limpar estado corrompido
  const clearCorruptedState = useCallback(() => {
    chatLogger.log('CLEARING_CORRUPTED_STATE');
    setCurrentSession(null);
    setMessages([]);
    setIsLoading(false);
    currentSessionRef.current = null;
    
    // Limpar caches
    messagesCache.current.clear();
  }, []);

  // Recuperação automática de erros
  const recoverFromError = useCallback(() => {
    chatLogger.log('STARTING_ERROR_RECOVERY');
    clearCorruptedState();
    
    if (user?.id && agentId) {
      loadSessions();
    }
    
    chatLogger.log('ERROR_RECOVERY_COMPLETED');
  }, [user?.id, agentId]);

  // FASE 4: Carregar sessões com cache otimizado
  const loadSessions = useCallback(async () => {
    if (!user?.id || !agentId || !mountedRef.current) {
      chatLogger.log('LOAD_SESSIONS_SKIPPED', { hasUser: !!user?.id, hasAgent: !!agentId, mounted: mountedRef.current });
      return;
    }

    // Verificar cache primeiro
    const cacheKey = `${user.id}-${agentId}`;
    const cachedSessions = sessionsCache.current.get(cacheKey);
    
    if (cachedSessions && cachedSessions.length > 0) {
      chatLogger.log('SESSIONS_LOADED_FROM_CACHE', { count: cachedSessions.length });
      setSessions(cachedSessions);
      return;
    }

    setIsLoading(true);
    chatLogger.log('LOADING_SESSIONS', { agentId, userId: user.id });

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('agent_id', agentId)
        .order('updated_at', { ascending: false });

      if (error) {
        chatLogger.error('LOAD_SESSIONS_ERROR', error);
        throw error;
      }

      if (!mountedRef.current) return;

      const typedSessions = (data || []) as ChatSession[];
      setSessions(typedSessions);
      
      // Atualizar cache
      sessionsCache.current.set(cacheKey, typedSessions);
      
      chatLogger.log('SESSIONS_LOADED', { count: typedSessions.length });
      
    } catch (error) {
      chatLogger.error('LOAD_SESSIONS_EXCEPTION', error);
      if (mountedRef.current) {
        toast.error('Erro ao carregar conversas');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user?.id, agentId]);

  // FASE 4: Carregar mensagens com cache
  const loadMessages = useCallback(async (sessionId: string) => {
    if (!sessionId || !mountedRef.current) {
      chatLogger.log('LOAD_MESSAGES_SKIPPED', { sessionId, mounted: mountedRef.current });
      return;
    }

    // Verificar cache primeiro
    const cachedMessages = messagesCache.current.get(sessionId);
    if (cachedMessages) {
      chatLogger.log('MESSAGES_LOADED_FROM_CACHE', { sessionId, count: cachedMessages.length });
      setMessages(cachedMessages);
      return;
    }

    chatLogger.log('LOADING_MESSAGES', { sessionId });

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        chatLogger.error('LOAD_MESSAGES_ERROR', error);
        throw error;
      }

      if (!mountedRef.current) return;

      const typedMessages = (data || []).map(msg => ({
        ...msg,
        role: msg.role as 'user' | 'assistant'
      })) as ChatMessage[];

      setMessages(typedMessages);
      
      // Atualizar cache
      messagesCache.current.set(sessionId, typedMessages);
      
      chatLogger.log('MESSAGES_LOADED', { sessionId, count: typedMessages.length });
      
    } catch (error) {
      chatLogger.error('LOAD_MESSAGES_EXCEPTION', error);
      if (mountedRef.current) {
        setMessages([]);
        toast.error('Erro ao carregar mensagens');
      }
    }
  }, []);

  // FASE 5: Desativar sessões com debounce
  const deactivateAllSessions = useCallback(async () => {
    if (!user?.id || !agentId) return;

    return debouncedDatabaseOperation(async () => {
      try {
        await supabase
          .from('chat_sessions')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .eq('agent_id', agentId);
        
        chatLogger.log('ALL_SESSIONS_DEACTIVATED');
        
        // Invalidar cache
        const cacheKey = `${user.id}-${agentId}`;
        sessionsCache.current.delete(cacheKey);
        
      } catch (error) {
        chatLogger.error('DEACTIVATE_SESSIONS_ERROR', error);
      }
    }, 100);
  }, [user?.id, agentId, debouncedDatabaseOperation]);

  // FASE 6: Otimização de encontrar/criar sessão
  const findOrCreateSessionForAgent = useCallback(async (agentName: string, forceNew = false) => {
    if (!user?.id || !mountedRef.current) {
      chatLogger.error('CREATE_SESSION_INVALID_STATE', { hasUser: !!user?.id, mounted: mountedRef.current });
      return null;
    }
    
    setIsLoading(true);
    chatLogger.log('FIND_OR_CREATE_SESSION', { agentName, forceNew, agentId });

    try {
      let session = null;
      
      if (!forceNew) {
        // Buscar na cache primeiro
        const cacheKey = `${user.id}-${agentId}`;
        const cachedSessions = sessionsCache.current.get(cacheKey);
        
        if (cachedSessions) {
          const activeSession = cachedSessions.find(s => s.is_active);
          if (activeSession) {
            session = activeSession;
            chatLogger.log('ACTIVE_SESSION_FOUND_IN_CACHE', { sessionId: session.id });
          } else {
            // Pegar a mais recente se não houver ativa
            session = cachedSessions[0] || null;
            if (session) {
              chatLogger.log('RECENT_SESSION_FOUND_IN_CACHE', { sessionId: session.id });
            }
          }
        }

        // Se não encontrou na cache, buscar no banco
        if (!session) {
          const { data: activeSessions } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('user_id', user.id)
            .eq('agent_id', agentId)
            .eq('is_active', true)
            .order('updated_at', { ascending: false })
            .limit(1);

          if (activeSessions && activeSessions.length > 0) {
            session = activeSessions[0] as ChatSession;
            chatLogger.log('ACTIVE_SESSION_FOUND', { sessionId: session.id });
          } else {
            const { data: recentSessions } = await supabase
              .from('chat_sessions')
              .select('*')
              .eq('user_id', user.id)
              .eq('agent_id', agentId)
              .order('updated_at', { ascending: false })
              .limit(1);

            if (recentSessions && recentSessions.length > 0) {
              session = recentSessions[0] as ChatSession;
              chatLogger.log('RECENT_SESSION_FOUND', { sessionId: session.id });
            }
          }
        }
      }

      // Criar nova sessão se necessário
      if (!session || forceNew) {
        chatLogger.log('CREATING_NEW_SESSION', { agentName, forceNew });
        
        await deactivateAllSessions();
        
        const { data: newSession, error: createError } = await supabase
          .from('chat_sessions')
          .insert({
            user_id: user.id,
            agent_id: agentId,
            agent_name: agentName,
            title: null,
            is_active: true
          })
          .select()
          .single();
        
        if (createError) {
          chatLogger.error('CREATE_SESSION_ERROR', createError);
          throw createError;
        }

        session = newSession as ChatSession;
        chatLogger.log('SESSION_CREATED', { sessionId: session.id });
        
        await loadSessions();
        setMessages([]);
        messagesCache.current.delete(session.id);
      } else {
        await deactivateAllSessions();
        await supabase
          .from('chat_sessions')
          .update({ is_active: true })
          .eq('id', session.id);
        
        session.is_active = true;
        chatLogger.log('SESSION_ACTIVATED', { sessionId: session.id });
      }
      
      setCurrentSession(session);
      currentSessionRef.current = session;
      
      if (session && !forceNew) {
        await loadMessages(session.id);
      }
      
      setIsLoading(false);
      return session;
      
    } catch (error) {
      chatLogger.error('FIND_OR_CREATE_EXCEPTION', error);
      if (mountedRef.current) {
        setIsLoading(false);
        toast.error('Erro ao inicializar conversa');
      }
      return null;
    }
  }, [user?.id, agentId, deactivateAllSessions, loadSessions, loadMessages]);

  const createNewSession = useCallback(async (agentName: string) => {
    chatLogger.log('FORCE_NEW_SESSION', { agentName });
    return await findOrCreateSessionForAgent(agentName, true);
  }, [findOrCreateSessionForAgent]);

  // CORREÇÃO: Função selectSession corrigida para receber apenas um argumento
  const selectSession = useCallback(async (session: ChatSession) => {
    if (!mountedRef.current) return;
    
    chatLogger.log('SELECTING_SESSION', { 
      oldSessionId: currentSession?.id, 
      newSessionId: session.id 
    });
    
    try {
      await deactivateAllSessions();
      
      await supabase
        .from('chat_sessions')
        .update({ is_active: true })
        .eq('id', session.id);
      
      const updatedSession = { ...session, is_active: true };
      setCurrentSession(updatedSession);
      currentSessionRef.current = updatedSession;
      
      setMessages([]);
      await loadMessages(session.id);
      
      setSessions(prev => prev.map(s => ({
        ...s,
        is_active: s.id === session.id
      })));
      
      chatLogger.log('SESSION_SELECTED_SUCCESSFULLY', { sessionId: session.id });
      
    } catch (error) {
      chatLogger.error('SELECT_SESSION_ERROR', error);
      toast.error('Erro ao selecionar conversa');
    }
  }, [currentSession, deactivateAllSessions, loadMessages]);

  // FASE 4: Adicionar mensagem com cache otimizado
  const addMessage = useCallback(async (
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    tokensUsed: number = 0
  ) => {
    if (!sessionId || !content.trim() || !mountedRef.current) {
      chatLogger.error('ADD_MESSAGE_INVALID_PARAMS', { sessionId, role, hasContent: !!content.trim() });
      return null;
    }

    chatLogger.log('ADDING_MESSAGE', { sessionId, role, contentLength: content.length });

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          role,
          content,
          tokens_used: tokensUsed,
          streaming_complete: role === 'user'
        })
        .select()
        .single();

      if (error) {
        chatLogger.error('ADD_MESSAGE_DB_ERROR', error);
        throw error;
      }

      const newMessage = {
        ...data,
        role: data.role as 'user' | 'assistant'
      } as ChatMessage;
      
      if (currentSessionRef.current?.id === sessionId) {
        setMessages(prev => [...prev, newMessage]);
        
        // Atualizar cache
        const cachedMessages = messagesCache.current.get(sessionId) || [];
        messagesCache.current.set(sessionId, [...cachedMessages, newMessage]);
      }
      
      // FASE 5: Atualizar timestamp com debounce
      debouncedDatabaseOperation(async () => {
        await supabase
          .from('chat_sessions')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', sessionId);
      });
      
      await loadSessions();
      
      chatLogger.log('MESSAGE_ADDED', { messageId: newMessage.id, sessionId });
      return newMessage;
      
    } catch (error) {
      chatLogger.error('ADD_MESSAGE_EXCEPTION', error);
      toast.error('Erro ao enviar mensagem');
      throw error;
    }
  }, [loadSessions, debouncedDatabaseOperation]);

  // Deletar sessão com limpeza de cache
  const deleteSession = useCallback(async (sessionId: string) => {
    if (!sessionId || !mountedRef.current) return;
    
    chatLogger.log('DELETING_SESSION', { sessionId });

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) {
        chatLogger.error('DELETE_SESSION_ERROR', error);
        throw error;
      }

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setMessages([]);
        currentSessionRef.current = null;
      }

      // Limpar caches
      messagesCache.current.delete(sessionId);
      if (user?.id) {
        const cacheKey = `${user.id}-${agentId}`;
        sessionsCache.current.delete(cacheKey);
      }

      chatLogger.log('SESSION_DELETED', { sessionId });
      toast.success('Conversa excluída');
      
    } catch (error) {
      chatLogger.error('DELETE_SESSION_EXCEPTION', error);
      toast.error('Erro ao excluir conversa');
    }
  }, [currentSession, user?.id, agentId]);

  // Sincronizar ref quando currentSession mudar
  useEffect(() => {
    currentSessionRef.current = currentSession;
  }, [currentSession]);

  // Inicialização
  useEffect(() => {
    mountedRef.current = true;
    if (user?.id && agentId) {
      chatLogger.log('INITIALIZING_CHAT_HOOK', { agentId, userId: user.id });
      loadSessions();
    }
    
    return () => {
      mountedRef.current = false;
      
      // Cleanup de timers
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      chatLogger.log('CHAT_HOOK_UNMOUNTED', { agentId });
    };
  }, [loadSessions, user?.id, agentId]);

  return {
    sessions,
    currentSession,
    messages,
    isLoading,
    findOrCreateSessionForAgent,
    createNewSession,
    selectSession,
    addMessage,
    deleteSession,
    loadSessions,
    validateState: validateChatState,
    recoverFromError
  };
};
