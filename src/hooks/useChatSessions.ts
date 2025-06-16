
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

// Sistema de logs detalhado
const chatLogger = {
  log: (action: string, data?: any) => {
    console.log(`[CHAT] ${new Date().toISOString()} - ${action}:`, data || '');
  },
  error: (action: string, error: any) => {
    console.error(`[CHAT ERROR] ${new Date().toISOString()} - ${action}:`, error);
  }
};

// Estado global do chat para validação
interface ChatState {
  activeSessionId: string | null;
  sessions: Map<string, ChatSession>;
  messages: Map<string, ChatMessage[]>;
  isLoading: boolean;
  error: string | null;
}

export const useChatSessions = (agentId: string) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  
  // Refs para controle de estado
  const mountedRef = useRef(true);
  const stateRef = useRef<ChatState>({
    activeSessionId: null,
    sessions: new Map(),
    messages: new Map(),
    isLoading: false,
    error: null
  });

  // Função de validação completa do estado
  const validateChatState = useCallback(() => {
    chatLogger.log('VALIDATING_STATE', {
      currentSessionId: currentSession?.id,
      sessionsCount: sessions.length,
      messagesCount: messages.length,
      agentId
    });

    const issues: string[] = [];
    
    // Validar estado básico
    if (!mountedRef.current) {
      issues.push('Hook não está montado');
    }

    // Validar sessão ativa
    if (currentSession && !sessions.find(s => s.id === currentSession.id)) {
      issues.push('Sessão ativa não existe na lista de sessões');
    }

    // Validar consistência de dados
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
    stateRef.current = {
      activeSessionId: null,
      sessions: new Map(),
      messages: new Map(),
      isLoading: false,
      error: null
    };
  }, []);

  // Recuperação automática de erros
  const recoverFromError = useCallback(() => {
    chatLogger.log('STARTING_ERROR_RECOVERY');
    
    clearCorruptedState();
    
    // Recarregar dados
    if (user?.id && agentId) {
      loadSessions();
    }
    
    chatLogger.log('ERROR_RECOVERY_COMPLETED');
  }, [user?.id, agentId]);

  // Carregar sessões com validação robusta
  const loadSessions = useCallback(async () => {
    if (!user?.id || !agentId || !mountedRef.current) {
      chatLogger.log('LOAD_SESSIONS_SKIPPED', { hasUser: !!user?.id, hasAgent: !!agentId, mounted: mountedRef.current });
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
      
      // Atualizar ref de estado
      stateRef.current.sessions = new Map(typedSessions.map(s => [s.id, s]));
      
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

  // Carregar mensagens com validação
  const loadMessages = useCallback(async (sessionId: string) => {
    if (!sessionId || !mountedRef.current) {
      chatLogger.log('LOAD_MESSAGES_SKIPPED', { sessionId, mounted: mountedRef.current });
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
      
      // Atualizar ref de estado
      stateRef.current.messages.set(sessionId, typedMessages);
      
      chatLogger.log('MESSAGES_LOADED', { sessionId, count: typedMessages.length });
      
    } catch (error) {
      chatLogger.error('LOAD_MESSAGES_EXCEPTION', error);
      if (mountedRef.current) {
        setMessages([]);
        toast.error('Erro ao carregar mensagens');
      }
    }
  }, []);

  // Encontrar ou criar sessão com estado limpo
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
        // Buscar sessão existente
        session = sessions.find(s => s.agent_id === agentId) || null;
        
        if (session) {
          chatLogger.log('SESSION_FOUND_IN_MEMORY', { sessionId: session.id });
          
          // Validar se sessão ainda existe no banco
          const { data: dbSession } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('id', session.id)
            .single();
            
          if (dbSession) {
            setCurrentSession(session);
            stateRef.current.activeSessionId = session.id;
            await loadMessages(session.id);
            setIsLoading(false);
            return session;
          } else {
            // Sessão não existe mais no banco, remover da memória
            setSessions(prev => prev.filter(s => s.id !== session!.id));
            session = null;
          }
        }
        
        if (!session) {
          // Buscar no banco
          const { data: existingSessions } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('user_id', user.id)
            .eq('agent_id', agentId)
            .order('created_at', { ascending: false })
            .limit(1);

          if (existingSessions && existingSessions.length > 0) {
            session = existingSessions[0] as ChatSession;
            chatLogger.log('SESSION_FOUND_IN_DB', { sessionId: session.id });
            
            // Adicionar à memória
            setSessions(prev => {
              const exists = prev.find(s => s.id === session!.id);
              if (!exists) {
                return [session!, ...prev];
              }
              return prev;
            });
          }
        }
      }

      // Criar nova sessão se necessário
      if (!session || forceNew) {
        chatLogger.log('CREATING_NEW_SESSION', { agentName, forceNew });
        
        // Desativar sessão atual
        if (currentSession) {
          await supabase
            .from('chat_sessions')
            .update({ is_active: false })
            .eq('id', currentSession.id);
        }
        
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
        
        // Atualizar estado
        setSessions(prev => [session!, ...prev.filter(s => s.id !== session!.id)]);
        setMessages([]);
        stateRef.current.messages.set(session.id, []);
      }
      
      // Ativar sessão
      setCurrentSession(session);
      stateRef.current.activeSessionId = session.id;
      
      // Carregar mensagens se não for nova
      if (!forceNew && session) {
        await loadMessages(session.id);
      }
      
      setIsLoading(false);
      chatLogger.log('SESSION_ACTIVATED', { sessionId: session.id });
      return session;
      
    } catch (error) {
      chatLogger.error('FIND_OR_CREATE_EXCEPTION', error);
      if (mountedRef.current) {
        setIsLoading(false);
        toast.error('Erro ao inicializar conversa');
      }
      return null;
    }
  }, [user?.id, agentId, sessions, currentSession, loadMessages]);

  // Criar nova sessão forçada
  const createNewSession = useCallback(async (agentName: string) => {
    chatLogger.log('FORCE_NEW_SESSION', { agentName });
    return await findOrCreateSessionForAgent(agentName, true);
  }, [findOrCreateSessionForAgent]);

  // Selecionar sessão com limpeza de estado
  const selectSession = useCallback(async (session: ChatSession) => {
    if (!mountedRef.current) return;
    
    chatLogger.log('SELECTING_SESSION', { 
      oldSessionId: currentSession?.id, 
      newSessionId: session.id 
    });
    
    try {
      // Desativar sessão atual
      if (currentSession && currentSession.id !== session.id) {
        await supabase
          .from('chat_sessions')
          .update({ is_active: false })
          .eq('id', currentSession.id);
      }
      
      // Ativar nova sessão
      await supabase
        .from('chat_sessions')
        .update({ is_active: true })
        .eq('id', session.id);
      
      // Limpar estado anterior
      setMessages([]);
      setCurrentSession(session);
      stateRef.current.activeSessionId = session.id;
      
      // Carregar mensagens da nova sessão
      await loadMessages(session.id);
      
      chatLogger.log('SESSION_SELECTED', { sessionId: session.id });
      
    } catch (error) {
      chatLogger.error('SELECT_SESSION_ERROR', error);
      toast.error('Erro ao selecionar conversa');
    }
  }, [currentSession, loadMessages]);

  // Adicionar mensagem com validação
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
      
      // Atualizar estado apenas se for da sessão ativa
      if (currentSession?.id === sessionId) {
        setMessages(prev => {
          const updated = [...prev, newMessage];
          stateRef.current.messages.set(sessionId, updated);
          return updated;
        });
      }
      
      // Atualizar timestamp da sessão
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId);
      
      // Recarregar sessões para atualizar ordem
      await loadSessions();
      
      chatLogger.log('MESSAGE_ADDED', { messageId: newMessage.id, sessionId });
      return newMessage;
      
    } catch (error) {
      chatLogger.error('ADD_MESSAGE_EXCEPTION', error);
      toast.error('Erro ao enviar mensagem');
      throw error;
    }
  }, [currentSession, loadSessions]);

  // Deletar sessão com limpeza
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

      // Atualizar estado
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      stateRef.current.sessions.delete(sessionId);
      stateRef.current.messages.delete(sessionId);
      
      // Limpar sessão ativa se for a deletada
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setMessages([]);
        stateRef.current.activeSessionId = null;
      }

      chatLogger.log('SESSION_DELETED', { sessionId });
      toast.success('Conversa excluída');
      
    } catch (error) {
      chatLogger.error('DELETE_SESSION_EXCEPTION', error);
      toast.error('Erro ao excluir conversa');
    }
  }, [currentSession]);

  // Monitoramento contínuo do estado
  useEffect(() => {
    const interval = setInterval(() => {
      if (mountedRef.current && !validateChatState()) {
        chatLogger.error('STATE_CORRUPTION_DETECTED', 'Iniciando recuperação automática');
        recoverFromError();
      }
    }, 10000); // Verificar a cada 10 segundos

    return () => clearInterval(interval);
  }, [validateChatState, recoverFromError]);

  // Inicialização
  useEffect(() => {
    mountedRef.current = true;
    if (user?.id && agentId) {
      chatLogger.log('INITIALIZING_CHAT_HOOK', { agentId, userId: user.id });
      loadSessions();
    }
    
    return () => {
      mountedRef.current = false;
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
    // Funções de diagnóstico
    validateState: validateChatState,
    recoverFromError
  };
};
