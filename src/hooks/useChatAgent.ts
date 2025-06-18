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

  // Lista de emails de administradores
  const adminEmails = ['davicastrowp@gmail.com', 'admin@iacopychief.com'];
  const isAdmin = user?.email && adminEmails.includes(user.email);

  useEffect(() => {
    if (user) {
      loadUserSessions();
    }
  }, [user]);

  const loadUserSessions = async () => {
    if (!user) return;

    try {
      console.log('Carregando sessões do usuário:', user.id);
      
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

      console.log('Sessões encontradas:', sessionsData?.length || 0);

      const sessionsWithMessages = await Promise.all(
        (sessionsData || []).map(async (session) => {
          const { data: messagesData, error: messagesError } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('session_id', session.id)
            .order('created_at', { ascending: true });

          if (messagesError) {
            console.error('Erro ao carregar mensagens:', messagesError);
          }

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

      console.log('Sessões processadas:', sessionsWithMessages.length);
      setSessions(sessionsWithMessages);
    } catch (error) {
      console.error('Erro geral ao carregar sessões:', error);
    }
  };

  const saveSessionToSupabase = async (session: ChatSession) => {
    if (!user) {
      console.log('Usuário não logado, não salvando sessão');
      return null;
    }

    try {
      console.log('Salvando sessão:', session.id);
      
      // Determinar se é agente customizado
      const isCustomAgent = selectedAgent?.id.startsWith('custom-');
      const actualAgentId = isCustomAgent 
        ? selectedAgent.id.replace('custom-', '') 
        : selectedAgent?.id || session.agent_id || '';
      
      const sessionData = {
        id: session.id,
        user_id: user.id,
        title: session.title,
        agent_name: selectedAgent?.name || session.agent_name || '',
        agent_id: actualAgentId,
        product_id: selectedProductId || session.product_id || null,
        is_active: true,
        message_count: session.messages.length,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('chat_sessions')
        .upsert(sessionData)
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar sessão:', error);
        return null;
      }

      console.log('Sessão salva com sucesso:', data);
      return data;
    } catch (error) {
      console.error('Erro geral ao salvar sessão:', error);
      return null;
    }
  };

  const saveMessageToSupabase = async (sessionId: string, message: ChatMessage) => {
    if (!user) {
      console.log('Usuário não logado, não salvando mensagem');
      return;
    }

    try {
      console.log('Salvando mensagem:', message.id);
      
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          id: message.id,
          session_id: sessionId,
          role: message.role,
          content: message.content,
          tokens_used: 0
        });

      if (error) {
        console.error('Erro ao salvar mensagem:', error);
      } else {
        console.log('Mensagem salva com sucesso');
      }
    } catch (error) {
      console.error('Erro geral ao salvar mensagem:', error);
    }
  };

  const createNewSession = useCallback(async () => {
    const sessionId = crypto.randomUUID();
    
    const newSession: ChatSession = {
      id: sessionId,
      title: 'Nova conversa',
      created_at: new Date().toISOString(),
      messages: [],
      agent_name: selectedAgent?.name,
      agent_id: selectedAgent?.id,
      product_id: selectedProductId
    };
    
    console.log('Criando nova sessão:', sessionId);
    
    if (user) {
      const savedSession = await saveSessionToSupabase(newSession);
      if (savedSession) {
        console.log('Nova sessão salva no Supabase');
      }
    }
    
    setSessions(prev => [newSession, ...prev]);
    setActiveSession(newSession);
  }, [selectedAgent, selectedProductId, user]);

  const selectSession = useCallback((sessionId: string) => {
    console.log('Selecionando sessão:', sessionId);
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setActiveSession(session);
    }
  }, [sessions]);

  const deleteSession = useCallback(async (sessionId: string) => {
    console.log('Deletando sessão:', sessionId);
    
    if (user) {
      try {
        const { error } = await supabase
          .from('chat_sessions')
          .update({ is_active: false })
          .eq('id', sessionId);
          
        if (error) {
          console.error('Erro ao deletar sessão:', error);
        } else {
          console.log('Sessão marcada como inativa no Supabase');
        }
      } catch (error) {
        console.error('Erro geral ao deletar sessão:', error);
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

    const userMessageId = crypto.randomUUID();
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content,
      timestamp: new Date()
    };

    console.log('Enviando mensagem do usuário:', userMessageId);

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
    
    if (user) {
      await saveMessageToSupabase(activeSession.id, userMessage);
      await saveSessionToSupabase(updatedSession);
    }
    
    setIsLoading(true);

    try {
      let productContext = '';
      if (selectedProductId) {
        const productDetails = await fetchProductDetails(selectedProductId);
        if (productDetails) {
          productContext = formatProductContext(productDetails);
        }
      }

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

      // Determinar se é agente customizado
      const isCustomAgent = selectedAgent.id.startsWith('custom-');

      console.log('Chamando chat function com userId:', user?.id);

      const { data, error } = await supabase.functions.invoke('chat-with-claude', {
        body: {
          message: content,
          agentPrompt: enhancedPrompt,
          chatHistory: activeSession.messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          agentName: selectedAgent.name,
          isCustomAgent,
          customAgentId: isCustomAgent ? selectedAgent.id.replace('custom-', '') : null,
          productId: selectedProductId,
          userId: user?.id // Garantir que o userId seja enviado
        }
      });

      if (error) {
        console.error('Error calling chat function:', error);
        
        // Tratamento especial para administradores
        if (isAdmin) {
          console.log('Erro detectado para admin, verificando detalhes:', error);
          
          // Se for erro relacionado a créditos da API, mostrar mensagem específica para admin
          if (error.message?.includes('credit balance') || error.message?.includes('API')) {
            toast.error('Erro na API de IA: Verifique os créditos da conta Anthropic nas configurações do sistema.');
          } else {
            toast.error(`Erro no sistema de chat: ${error.message || 'Erro desconhecido'}`);
          }
        } else {
          // Para usuários normais, mensagem mais genérica
          toast.error('Erro temporário no chat. Tente novamente em alguns instantes.');
        }
        return;
      }

      const assistantMessageId = crypto.randomUUID();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: data.response || 'Resposta não disponível',
        timestamp: new Date()
      };

      console.log('Recebendo resposta do assistente:', assistantMessageId);

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, assistantMessage]
      };
      
      setActiveSession(finalSession);
      setSessions(prev => prev.map(s => s.id === activeSession.id ? finalSession : s));

      if (user) {
        await saveMessageToSupabase(activeSession.id, assistantMessage);
        await saveSessionToSupabase(finalSession);
      }

    } catch (error) {
      console.error('Chat error:', error);
      
      // Tratamento de erro mais específico
      if (isAdmin) {
        toast.error(`Erro técnico: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Verifique os logs para mais detalhes.`);
      } else {
        toast.error('Erro ao processar mensagem. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedAgent, activeSession, selectedProductId, fetchProductDetails, user, isAdmin]);

  const regenerateLastMessage = useCallback(async () => {
    if (!activeSession || !selectedAgent) return;
    
    const messages = activeSession.messages;
    if (messages.length < 2) return;
    
    const lastUserMessage = messages[messages.length - 2];
    if (lastUserMessage.role !== 'user') return;
    
    const updatedMessages = messages.slice(0, -1);
    const updatedSession = {
      ...activeSession,
      messages: updatedMessages
    };
    
    setActiveSession(updatedSession);
    setSessions(prev => prev.map(s => s.id === activeSession.id ? updatedSession : s));
    
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
