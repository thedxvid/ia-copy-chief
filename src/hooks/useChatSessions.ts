
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

export const useChatSessions = (agentId: string) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Função para encontrar ou criar uma sessão para o agente
  const findOrCreateSessionForAgent = useCallback(async (agentName: string) => {
    if (!user?.id) return null;
    setIsLoading(true);

    try {
      // 1. Tenta encontrar uma sessão existente na memória
      let session = sessions.find(s => s.agent_id === agentId) || null;
      
      // 2. Se não encontrar na memória, busca no banco
      if (!session) {
        const { data: existingSessions, error: fetchError } = await supabase
          .from('chat_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('agent_id', agentId)
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error('Erro ao buscar sessões:', fetchError);
          toast.error('Erro ao buscar sessões de chat.');
          setIsLoading(false);
          return null;
        }

        if (existingSessions && existingSessions.length > 0) {
          session = existingSessions[0] as ChatSession;
          setSessions(prev => {
            const exists = prev.find(s => s.id === session!.id);
            if (!exists) {
              return [session!, ...prev];
            }
            return prev;
          });
        }
      }

      // 3. Se ainda não houver sessão, cria uma nova
      if (!session) {
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
          console.error('Erro ao criar sessão:', createError);
          toast.error('Não foi possível iniciar um novo chat.');
          setIsLoading(false);
          return null;
        }

        session = newSession as ChatSession;
        setSessions(prev => [session!, ...prev]);
      }
      
      setCurrentSession(session);
      setMessages([]);
      setIsLoading(false);
      return session;
    } catch (error) {
      console.error('Erro na findOrCreateSessionForAgent:', error);
      toast.error('Erro ao inicializar chat.');
      setIsLoading(false);
      return null;
    }
  }, [user?.id, agentId, sessions]);

  // Carregar sessões do agente
  const loadSessions = useCallback(async () => {
    if (!user?.id || !agentId) return;

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('agent_id', agentId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
    }
  }, [user?.id, agentId]);

  // Carregar mensagens da sessão atual
  const loadMessages = useCallback(async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const typedMessages = (data || []).map(msg => ({
        ...msg,
        role: msg.role as 'user' | 'assistant'
      })) as ChatMessage[];
      
      setMessages(typedMessages);
    } catch (error) {
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

      if (error) throw error;

      const newMessage = {
        ...data,
        role: data.role as 'user' | 'assistant'
      } as ChatMessage;
      
      setMessages(prev => [...prev, newMessage]);
      await loadSessions();
      
      return newMessage;
    } catch (error) {
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
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({
          content,
          streaming_complete: isComplete
        })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content, streaming_complete: isComplete }
          : msg
      ));
    } catch (error) {
      console.error('Erro ao atualizar mensagem:', error);
    }
  }, []);

  // Deletar sessão
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }

      toast.success('Conversa excluída');
    } catch (error) {
      console.error('Erro ao deletar sessão:', error);
      toast.error('Erro ao excluir conversa');
    }
  }, [currentSession]);

  // Carregar na inicialização
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

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
