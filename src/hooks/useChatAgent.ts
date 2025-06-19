import { useState, useEffect } from 'react';
import { ChatMessage, Agent, ChatSession } from '@/types/chat';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useUser } from '@supabase/auth-helpers-react';

export const useChatAgent = (selectedProductId?: string) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const supabase = useSupabaseClient();
  const user = useUser();

  // Load sessions on mount
  useEffect(() => {
    if (!user) {
      console.log('useChatAgent: Usuário não logado, não carregando sessões');
      return;
    }

    const loadSessions = async () => {
      console.log('useChatAgent: Iniciando carregamento de sessões para usuário:', user.id);
      
      try {
        const { data, error } = await supabase
          .from('chat_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('useChatAgent: Erro ao carregar sessões:', error);
          return;
        }

        console.log('useChatAgent: Sessões carregadas do banco:', data?.length || 0);

        if (data) {
          const loadedSessions: ChatSession[] = data.map(session => ({
            ...session,
            messages: [] // Inicializa as mensagens como um array vazio
          }));
          
          console.log('useChatAgent: Atualizando estado com sessões:', loadedSessions.length);
          setSessions(loadedSessions);

          // Se não há sessão ativa e existem sessões carregadas, não selecionar automaticamente
          // Deixar o usuário escolher qual sessão abrir
          console.log('useChatAgent: Sessões carregadas com sucesso');
        }
      } catch (error) {
        console.error('useChatAgent: Erro ao carregar sessões:', error);
      }
    };

    loadSessions();
  }, [supabase, user]);

  // Load messages for active session
  useEffect(() => {
    if (!activeSession) {
      console.log('useChatAgent: Nenhuma sessão ativa, não carregando mensagens');
      return;
    }

    const loadMessages = async () => {
      console.log('useChatAgent: Carregando mensagens para sessão:', activeSession.id);
      
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', activeSession.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('useChatAgent: Erro ao carregar mensagens:', error);
          return;
        }

        if (data) {
          const loadedMessages: ChatMessage[] = data.map(message => ({
            ...message,
            timestamp: new Date(message.created_at)
          }));

          console.log('useChatAgent: Mensagens carregadas:', loadedMessages.length);

          setSessions(prev =>
            prev.map(session =>
              session.id === activeSession.id
                ? { ...session, messages: loadedMessages }
                : session
            )
          );
        }
      } catch (error) {
        console.error('useChatAgent: Erro ao carregar mensagens:', error);
      }
    };

    loadMessages();
  }, [supabase, activeSession]);

  const createNewSession = async () => {
    if (!user) {
      console.error('useChatAgent: Usuário não logado, não é possível criar sessão');
      return;
    }

    console.log('useChatAgent: Criando nova sessão...');

    const newSessionId = crypto.randomUUID();
    const newSession: ChatSession = {
      id: newSessionId,
      user_id: user.id,
      created_at: new Date().toISOString(),
      title: 'Nova conversa',
      messages: [],
      agent_id: selectedAgent?.id || 'default',
      agent_name: selectedAgent?.name || 'Assistente'
    };

    try {
      console.log('useChatAgent: Inserindo nova sessão no banco:', newSessionId);
      
      const { error } = await supabase
        .from('chat_sessions')
        .insert([{
          id: newSession.id,
          user_id: user.id,
          created_at: new Date().toISOString(),
          title: 'Nova conversa',
          agent_id: selectedAgent?.id || 'default',
          agent_name: selectedAgent?.name || 'Assistente'
        }]);

      if (error) {
        console.error('useChatAgent: Erro ao criar nova sessão no banco:', error);
        return;
      }

      console.log('useChatAgent: Nova sessão criada com sucesso, atualizando estado');
      
      // Adicionar a nova sessão no início da lista
      setSessions(prev => [newSession, ...prev]);
      
      // Definir como sessão ativa
      setActiveSession(newSession);
      
      console.log('useChatAgent: Nova sessão definida como ativa:', newSessionId);
      
    } catch (error) {
      console.error('useChatAgent: Erro ao criar nova sessão:', error);
    }
  };

  const selectSession = (sessionId: string) => {
    console.log('useChatAgent: Selecionando sessão:', sessionId);
    
    const session = sessions.find(session => session.id === sessionId);
    if (session) {
      console.log('useChatAgent: Sessão encontrada, definindo como ativa');
      setActiveSession(session);
    } else {
      console.error('useChatAgent: Sessão não encontrada:', sessionId);
    }
  };

  const deleteSession = async (sessionId: string) => {
    console.log('useChatAgent: Excluindo sessão:', sessionId);
    
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) {
        console.error('useChatAgent: Erro ao excluir sessão do banco:', error);
        return;
      }

      console.log('useChatAgent: Sessão excluída do banco, atualizando estado');
      
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      
      if (activeSession?.id === sessionId) {
        console.log('useChatAgent: Sessão ativa foi excluída, limpando sessão ativa');
        setActiveSession(null);
      }
    } catch (error) {
      console.error('useChatAgent: Erro ao excluir sessão:', error);
    }
  };

  const sendMessage = async (message: string) => {
    if (!selectedAgent || !activeSession) {
      console.error('useChatAgent: Agente ou sessão não selecionados');
      return;
    }

    console.log('useChatAgent: Enviando mensagem:', message.substring(0, 50) + '...');
    setIsLoading(true);
    
    try {
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        content: message,
        role: 'user',
        timestamp: new Date(),
        session_id: activeSession.id
      };

      // Adicionar mensagem do usuário imediatamente
      setSessions(prev => prev.map(session => 
        session.id === activeSession.id 
          ? { ...session, messages: [...session.messages, userMessage] }
          : session
      ));

      // Preparar dados para a API
      const requestData = {
        message,
        agentPrompt: selectedAgent.prompt,
        chatHistory: activeSession.messages.slice(-10), // Últimas 10 mensagens para contexto
        agentName: selectedAgent.name,
        isCustomAgent: selectedAgent.id.startsWith('custom-'),
        customAgentId: selectedAgent.id.startsWith('custom-') ? selectedAgent.id : null,
        productId: selectedProductId,
        userId: (await supabase.auth.getUser()).data.user?.id
      };

      console.log('Enviando mensagem para Claude:', {
        agentName: selectedAgent.name,
        messageLength: message.length,
        historyLength: requestData.chatHistory.length,
        productId: selectedProductId
      });

      // Chamada para a edge function com timeout
      const { data, error } = await supabase.functions.invoke('chat-with-claude', {
        body: requestData,
      });

      if (error) {
        console.error('Erro na edge function:', error);
        throw new Error(`Erro na comunicação: ${error.message}`);
      }

      // Verificar se houve erro na resposta
      if (data?.error || !data?.success) {
        console.error('Erro na resposta da API:', data);
        throw new Error(data?.error || 'Erro desconhecido na resposta da IA');
      }

      // Verificar se temos uma resposta válida
      if (!data?.response || typeof data.response !== 'string' || data.response.trim().length === 0) {
        console.error('Resposta inválida da IA:', data);
        throw new Error('A IA retornou uma resposta vazia ou inválida');
      }

      console.log('Resposta recebida com sucesso:', {
        responseLength: data.response.length,
        tokensUsed: data.tokensUsed,
        model: data.model,
        requestId: data.requestId
      });

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
        session_id: activeSession.id,
        tokens_used: data.tokensUsed,
        model_used: data.model
      };

      // Adicionar resposta da IA
      setSessions(prev => prev.map(session => 
        session.id === activeSession.id 
          ? { ...session, messages: [...session.messages, assistantMessage] }
          : session
      ));

      // Salvar mensagens no banco de dados
      try {
        await supabase.from('chat_messages').insert([
          {
            session_id: activeSession.id,
            content: userMessage.content,
            role: userMessage.role,
            created_at: userMessage.timestamp.toISOString()
          },
          {
            session_id: activeSession.id,
            content: assistantMessage.content,
            role: assistantMessage.role,
            tokens_used: data.tokensUsed,
            model_used: data.model,
            created_at: assistantMessage.timestamp.toISOString()
          }
        ]);
      } catch (dbError) {
        console.error('Erro ao salvar mensagens no banco:', dbError);
        // Não interromper o fluxo por erro de salvamento
      }

    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      
      // Criar mensagem de erro mais específica
      let errorMessage = 'Desculpe, ocorreu um erro ao processar sua mensagem.';
      
      if (error.message?.includes('timeout') || error.message?.includes('tempo')) {
        errorMessage = 'A resposta demorou muito para chegar. Tente novamente.';
      } else if (error.message?.includes('rate limit') || error.message?.includes('limite')) {
        errorMessage = 'Muitas requisições. Aguarde um momento antes de tentar novamente.';
      } else if (error.message?.includes('auth') || error.message?.includes('autorização')) {
        errorMessage = 'Erro de autenticação. Faça login novamente.';
      } else if (error.message?.includes('vazia') || error.message?.includes('inválida')) {
        errorMessage = 'A IA não conseguiu gerar uma resposta. Tente reformular sua pergunta.';
      }

      const errorMessageObj: ChatMessage = {
        id: crypto.randomUUID(),
        content: `❌ ${errorMessage}\n\n*Detalhes técnicos: ${error.message}*`,
        role: 'assistant',
        timestamp: new Date(),
        session_id: activeSession.id,
        is_error: true
      };

      setSessions(prev => prev.map(session => 
        session.id === activeSession.id 
          ? { ...session, messages: [...session.messages, errorMessageObj] }
          : session
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateLastMessage = async () => {
    if (!activeSession || activeSession.messages.length === 0 || isLoading) return;

    // Replace findLast with a compatible alternative
    const userMessages = activeSession.messages.filter(msg => msg.role === 'user');
    const lastMessage = userMessages[userMessages.length - 1];
    
    if (!lastMessage) return;

    // Remover a mensagem de erro, se existir
    setSessions(prev => prev.map(session => {
      if (session.id === activeSession.id) {
        const newMessages = session.messages.filter(msg => msg.id !== lastMessage.id && !msg.is_error);
        return { ...session, messages: newMessages };
      }
      return session;
    }));

    await sendMessage(lastMessage.content);
  };

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
    setSelectedAgent
  };
};
