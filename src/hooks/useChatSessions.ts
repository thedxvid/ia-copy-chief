
import { useState, useEffect, useCallback } from 'react';
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

const debugLog = (category: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🔍 SESSIONS_${category}: ${message}`, data || '');
};

export const useChatSessions = (agentId: string) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Função para encontrar ou criar uma sessão para o agente
  const findOrCreateSessionForAgent = useCallback(async (agentName: string) => {
    if (!user?.id) {
      debugLog('CREATE_SKIP', 'Usuário não autenticado');
      return null;
    }
    
    setIsLoading(true);
    debugLog('CREATE_START', 'Iniciando busca/criação de sessão', { agentId, agentName });

    try {
      // 1. Tenta encontrar uma sessão existente na memória primeiro
      let session = sessions.find(s => s.agent_id === agentId) || null;
      
      if (session) {
        debugLog('SESSION_FOUND_MEMORY', 'Sessão encontrada na memória', { sessionId: session.id });
        setCurrentSession(session);
        await loadMessages(session.id);
        setIsLoading(false);
        return session;
      }
      
      // 2. Se não encontrar na memória, busca no banco
      debugLog('SEARCH_DATABASE', 'Buscando sessões no banco de dados', { agentId });
      const { data: existingSessions, error: fetchError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError) {
        debugLog('SEARCH_ERROR', 'Erro ao buscar sessões', fetchError);
        toast.error('Erro ao buscar sessões de chat.');
        setIsLoading(false);
        return null;
      }

      if (existingSessions && existingSessions.length > 0) {
        session = existingSessions[0] as ChatSession;
        debugLog('SESSION_FOUND_DB', 'Sessão encontrada no banco', { sessionId: session.id });
        
        // Adicionar à memória
        setSessions(prev => {
          const exists = prev.find(s => s.id === session!.id);
          if (!exists) {
            return [session!, ...prev];
          }
          return prev;
        });
      }

      // 3. Se ainda não houver sessão, cria uma nova
      if (!session) {
        debugLog('CREATE_NEW', 'Criando nova sessão', { agentId, agentName });
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
          debugLog('CREATE_ERROR', 'Erro ao criar sessão', createError);
          toast.error('Não foi possível iniciar um novo chat.');
          setIsLoading(false);
          return null;
        }

        session = newSession as ChatSession;
        debugLog('SESSION_CREATED', 'Nova sessão criada', { sessionId: session.id });
        setSessions(prev => [session!, ...prev]);
      }
      
      setCurrentSession(session);
      
      // Carregar mensagens se existirem
      if (session) {
        await loadMessages(session.id);
      }
      
      setIsLoading(false);
      return session;
      
    } catch (error) {
      debugLog('CREATE_EXCEPTION', 'Exceção na criação de sessão', error);
      console.error('Erro na findOrCreateSessionForAgent:', error);
      toast.error('Erro ao inicializar chat.');
      setIsLoading(false);
      return null;
    }
  }, [user?.id, agentId, sessions]);

  // Carregar sessões do agente
  const loadSessions = useCallback(async () => {
    if (!user?.id || !agentId) {
      debugLog('LOAD_SKIP', 'Usuário ou agentId não disponível');
      return;
    }

    debugLog('LOAD_START', 'Carregando sessões', { agentId });
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('agent_id', agentId)
        .order('updated_at', { ascending: false });

      if (error) {
        debugLog('LOAD_ERROR', 'Erro ao carregar sessões', error);
        throw error;
      }
      
      debugLog('LOAD_SUCCESS', 'Sessões carregadas', { count: data?.length || 0 });
      setSessions(data || []);
    } catch (error) {
      debugLog('LOAD_EXCEPTION', 'Exceção no carregamento', error);
      console.error('Erro ao carregar sessões:', error);
    }
  }, [user?.id, agentId]);

  // Carregar mensagens da sessão atual
  const loadMessages = useCallback(async (sessionId: string) => {
    debugLog('MESSAGES_LOAD_START', 'Carregando mensagens', { sessionId });
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        debugLog('MESSAGES_LOAD_ERROR', 'Erro ao carregar mensagens', error);
        throw error;
      }
      
      const typedMessages = (data || []).map(msg => ({
        ...msg,
        role: msg.role as 'user' | 'assistant'
      })) as ChatMessage[];
      
      debugLog('MESSAGES_LOADED', 'Mensagens carregadas', { count: typedMessages.length });
      setMessages(typedMessages);
    } catch (error) {
      debugLog('MESSAGES_LOAD_EXCEPTION', 'Exceção no carregamento de mensagens', error);
      console.error('Erro ao carregar mensagens:', error);
      setMessages([]);
    }
  }, []);

  // Criar nova sessão
  const createNewSession = useCallback(async (agentName: string) => {
    return await findOrCreateSessionForAgent(agentName);
  }, [findOrCreateSessionForAgent]);

  // Selecionar sessão
  const selectSession = useCallback(async (session: ChatSession) => {
    debugLog('SELECT_SESSION', 'Selecionando sessão', { sessionId: session.id });
    setCurrentSession(session);
    await loadMessages(session.id);
  }, [loadMessages]);

  // Adicionar mensagem
  const addMessage = useCallback(async (
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    tokensUsed: number = 0
  ) => {
    debugLog('ADD_MESSAGE', 'Adicionando mensagem', { sessionId, role, contentLength: content.length });
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
        debugLog('ADD_MESSAGE_ERROR', 'Erro ao adicionar mensagem', error);
        throw error;
      }

      const newMessage = {
        ...data,
        role: data.role as 'user' | 'assistant'
      } as ChatMessage;
      
      setMessages(prev => [...prev, newMessage]);
      
      // Atualizar timestamp da sessão
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId);
      
      await loadSessions(); // Recarregar para atualizar ordem
      
      debugLog('MESSAGE_ADDED', 'Mensagem adicionada com sucesso', { messageId: newMessage.id });
      return newMessage;
    } catch (error) {
      debugLog('ADD_MESSAGE_EXCEPTION', 'Exceção ao adicionar mensagem', error);
      console.error('Erro ao adicionar mensagem:', error);
      throw error;
    }
  }, [loadSessions]);

  // Atualizar mensagem (para streaming)
  const updateMessage = useCallback(async (
    messageId: string,
    content: string,
    isComplete: boolean = false
  ) => {
    debugLog('UPDATE_MESSAGE', 'Atualizando mensagem', { messageId, isComplete, contentLength: content.length });
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({
          content,
          streaming_complete: isComplete
        })
        .eq('id', messageId);

      if (error) {
        debugLog('UPDATE_MESSAGE_ERROR', 'Erro ao atualizar mensagem', error);
        throw error;
      }

      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content, streaming_complete: isComplete }
          : msg
      ));
      
      debugLog('MESSAGE_UPDATED', 'Mensagem atualizada com sucesso', { messageId });
    } catch (error) {
      debugLog('UPDATE_MESSAGE_EXCEPTION', 'Exceção ao atualizar mensagem', error);
      console.error('Erro ao atualizar mensagem:', error);
    }
  }, []);

  // Deletar sessão
  const deleteSession = useCallback(async (sessionId: string) => {
    debugLog('DELETE_SESSION', 'Deletando sessão', { sessionId });
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) {
        debugLog('DELETE_SESSION_ERROR', 'Erro ao deletar sessão', error);
        throw error;
      }

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }

      debugLog('SESSION_DELETED', 'Sessão deletada com sucesso', { sessionId });
      toast.success('Conversa excluída');
    } catch (error) {
      debugLog('DELETE_SESSION_EXCEPTION', 'Exceção ao deletar sessão', error);
      console.error('Erro ao deletar sessão:', error);
      toast.error('Erro ao excluir conversa');
    }
  }, [currentSession]);

  // Carregar na inicialização
  useEffect(() => {
    if (user?.id && agentId) {
      debugLog('HOOK_INIT', 'Inicializando hook de sessões', { agentId });
      loadSessions();
    }
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
    updateMessage,
    deleteSession,
    loadSessions
  };
};
