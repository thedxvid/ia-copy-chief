
import { useState, useCallback, useEffect } from 'react';
import { ChatMessage, Agent, ChatState } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useProducts } from './useProducts';
import { formatProductContext } from '@/utils/productContext';
import { useAuth } from '@/contexts/AuthContext';

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  messages: ChatMessage[];
  agent_name?: string;
  agent_id?: string;
  product_id?: string;
}

export const useChatAgent = (selectedProductId?: string) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { fetchProductDetails } = useProducts();
  const { user } = useAuth();

  // Carregar sessões existentes do usuário
  useEffect(() => {
    if (user) {
      loadUserSessions();
    }
  }, [user]);

  const loadUserSessions = async () => {
    if (!user) return;

    try {
      const { data: sessionsData, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar sessões:', error);
        return;
      }

      const sessionsWithMessages = await Promise.all(
        (sessionsData || []).map(async (session) => {
          const { data: messagesData } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('session_id', session.id)
            .order('created_at', { ascending: true });

          const messages: ChatMessage[] = (messagesData || []).map(msg => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.created_at)
          }));

          return {
            id: session.id,
            title: session.title || 'Nova conversa',
            created_at: session.created_at,
            messages,
            agent_name: session.agent_name,
            agent_id: session.agent_id,
            product_id: session.product_id
          };
        })
      );

      setSessions(sessionsWithMessages);
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
    }
  };

  const saveSessionToSupabase = async (session: ChatSession) => {
    if (!user) return null;

    try {
      // Inserir ou atualizar sessão
      const { data: sessionData, error: sessionError } = await supabase
        .from('chat_sessions')
        .upsert({
          id: session.id,
          user_id: user.id,
          title: session.title,
          agent_name: selectedAgent?.name || '',
          agent_id: selectedAgent?.id || '',
          product_id: selectedProductId || null,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Erro ao salvar sessão:', sessionError);
        return null;
      }

      return sessionData;
    } catch (error) {
      console.error('Erro ao salvar sessão:', error);
      return null;
    }
  };

  const saveMessageToSupabase = async (sessionId: string, message: ChatMessage) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          role: message.role,
          content: message.content,
          tokens_used: 0
        });

      if (error) {
        console.error('Erro ao salvar mensagem:', error);
      }
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
    }
  };

  const createNewSession = useCallback(async () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'Nova conversa',
      created_at: new Date().toISOString(),
      messages: [],
      agent_name: selectedAgent?.name,
      agent_id: selectedAgent?.id,
      product_id: selectedProductId
    };
    
    // Salvar no Supabase se usuário estiver logado
    if (user) {
      await saveSessionToSupabase(newSession);
    }
    
    setSessions(prev => [newSession, ...prev]);
    setActiveSession(newSession);
  }, [selectedAgent, selectedProductId, user]);

  const selectSession = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setActiveSession(session);
    }
  }, [sessions]);

  const deleteSession = useCallback(async (sessionId: string) => {
    // Deletar do Supabase se usuário estiver logado
    if (user) {
      try {
        await supabase
          .from('chat_sessions')
          .update({ is_active: false })
          .eq('id', sessionId);
      } catch (error) {
        console.error('Erro ao deletar sessão:', error);
      }
    }

    setSessions(prev => prev.filter(s => s.id !== sessionId));
    
    if (activeSession?.id === sessionId) {
      setActiveSession(null);
    }
    
    toast.success('Conversa excluída com sucesso');
  }, [activeSession, user]);

  const selectAgent = useCallback((agent: Agent) => {
    setSelectedAgent(agent);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!selectedAgent) {
      toast.error('Selecione um agente antes de enviar uma mensagem');
      return;
    }

    if (!activeSession) {
      toast.error('Nenhuma sessão ativa');
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    // Update session with user message
    const updatedSession = {
      ...activeSession,
      messages: [...activeSession.messages, userMessage],
      title: activeSession.messages.length === 0 
        ? content.length > 50 
          ? content.substring(0, 47) + '...' 
          : content
        : activeSession.title
    };
    
    setActiveSession(updatedSession);
    setSessions(prev => prev.map(s => s.id === activeSession.id ? updatedSession : s));
    
    // Salvar mensagem do usuário no Supabase
    if (user) {
      await saveMessageToSupabase(activeSession.id, userMessage);
      await saveSessionToSupabase(updatedSession);
    }
    
    setIsLoading(true);

    try {
      // Buscar contexto do produto se selecionado
      let productContext = '';
      if (selectedProductId) {
        const productDetails = await fetchProductDetails(selectedProductId);
        if (productDetails) {
          productContext = formatProductContext(productDetails);
        }
      }

      // Preparar o prompt do agente com contexto do produto
      let enhancedPrompt = selectedAgent.prompt;
      if (productContext) {
        enhancedPrompt = `${selectedAgent.prompt}

---
CONTEXTO DO PRODUTO SELECIONADO:
${productContext}

---
INSTRUÇÕES IMPORTANTES:
- Use as informações do produto acima como contexto principal quando relevante
- Se o usuário perguntar sobre criar conteúdo para "meu produto" ou "esse produto", refira-se ao produto do contexto
- Não pergunte novamente sobre qual produto quando as informações já estão disponíveis no contexto
- Mantenha consistência com a estratégia e posicionamento definidos no produto
`;
      }

      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('chat-with-claude', {
        body: {
          message: content,
          agentPrompt: enhancedPrompt,
          chatHistory: activeSession.messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          agentName: selectedAgent.name,
          isCustomAgent: false,
          productId: selectedProductId
        }
      });

      if (error) {
        console.error('Error calling chat function:', error);
        throw new Error(error.message || 'Erro ao conectar com a API');
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Resposta não disponível',
        timestamp: new Date()
      };

      // Update session with assistant message
      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, assistantMessage]
      };
      
      setActiveSession(finalSession);
      setSessions(prev => prev.map(s => s.id === activeSession.id ? finalSession : s));

      // Salvar mensagem do assistente no Supabase
      if (user) {
        await saveMessageToSupabase(activeSession.id, assistantMessage);
        await saveSessionToSupabase(finalSession);
      }

    } catch (error) {
      console.error('Chat error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar mensagem');
    } finally {
      setIsLoading(false);
    }
  }, [selectedAgent, activeSession, selectedProductId, fetchProductDetails, user]);

  const regenerateLastMessage = useCallback(async () => {
    if (!activeSession || !selectedAgent) return;
    
    const messages = activeSession.messages;
    if (messages.length < 2) return;
    
    const lastUserMessage = messages[messages.length - 2];
    if (lastUserMessage.role !== 'user') return;
    
    // Remove the last assistant message and regenerate
    const updatedMessages = messages.slice(0, -1);
    const updatedSession = {
      ...activeSession,
      messages: updatedMessages
    };
    
    setActiveSession(updatedSession);
    setSessions(prev => prev.map(s => s.id === activeSession.id ? updatedSession : s));
    
    // Re-send the last user message
    await sendMessage(lastUserMessage.content);
  }, [activeSession, selectedAgent, sendMessage]);

  const clearChat = useCallback(() => {
    if (activeSession) {
      const clearedSession = {
        ...activeSession,
        messages: []
      };
      setActiveSession(clearedSession);
      setSessions(prev => prev.map(s => s.id === activeSession.id ? clearedSession : s));
    }
  }, [activeSession]);

  return {
    sessions,
    activeSession,
    createNewSession,
    selectSession,
    deleteSession,
    sendMessage,
    regenerateLastMessage,
    isLoading,
    selectedAgent,
    setSelectedAgent: selectAgent,
    clearChat,
    loadUserSessions
  };
};
