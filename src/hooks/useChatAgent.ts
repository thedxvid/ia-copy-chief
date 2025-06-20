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

    console.log('📤 Enviando mensagem do usuário:', userMessageId);

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
      let productDetails = null;
      
      // DEBUG: Verificar se temos produto selecionado
      console.log('🔍 DEBUG - Produto selecionado:', {
        selectedProductId,
        hasProduct: !!selectedProductId
      });

      if (selectedProductId) {
        try {
          console.log('🔄 DEBUG - Buscando detalhes do produto...');
          productDetails = await fetchProductDetails(selectedProductId);
          
          console.log('📋 DEBUG - Resultado da busca:', {
            productId: selectedProductId,
            productFound: !!productDetails,
            productName: productDetails?.name || 'N/A',
            hasAllData: !!(productDetails?.strategy || productDetails?.offer || productDetails?.copy || productDetails?.meta)
          });
          
          if (productDetails) {
            console.log('🔄 DEBUG - Formatando contexto do produto...');
            productContext = formatProductContext(productDetails);
            
            console.log('✅ DEBUG - Contexto formatado:', {
              contextLength: productContext.length,
              contextPreview: productContext.substring(0, 300) + '...',
              hasProductName: productContext.includes(productDetails.name),
              hasValueProposition: productContext.includes('Proposta de Valor'),
              hasTargetAudience: productContext.includes('Público-Alvo')
            });
          } else {
            console.warn('⚠️ DEBUG - Produto não encontrado:', selectedProductId);
            toast.warning('Produto selecionado não encontrado. Continuando sem contexto específico.');
          }
        } catch (error) {
          console.error('❌ DEBUG - Erro ao buscar produto:', {
            productId: selectedProductId,
            error: error.message
          });
          toast.warning('Erro ao carregar contexto do produto. Continuando sem contexto específico.');
        }
      } else {
        console.log('ℹ️ DEBUG - Nenhum produto selecionado');
      }

      let enhancedPrompt = selectedAgent.prompt;
      if (productContext && productContext.trim()) {
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
- Sempre que mencionar "seu produto", refira-se especificamente ao ${productDetails?.name}
`;

        console.log('🚀 DEBUG - Prompt aprimorado com contexto:', {
          originalPromptLength: selectedAgent.prompt.length,
          enhancedPromptLength: enhancedPrompt.length,
          contextAdded: enhancedPrompt.length - selectedAgent.prompt.length,
          hasProductContext: enhancedPrompt.includes('CONTEXTO DO PRODUTO'),
          productName: productDetails?.name
        });
      } else {
        console.log('ℹ️ DEBUG - Usando prompt original sem contexto do produto');
      }

      // Determinar se é agente customizado
      const isCustomAgent = selectedAgent?.id.startsWith('custom-');

      console.log('🚀 DEBUG - Preparando chamada para IA:', {
        userId: user?.id,
        agentName: selectedAgent.name,
        isCustomAgent,
        hasProductContext: !!productContext,
        productId: selectedProductId,
        promptLength: enhancedPrompt.length
      });

      // Toast otimizado para processamento
      const loadingToast = toast.loading('🤖 Processando com contexto completo...', {
        duration: Infinity
      });

      const { data, error } = await supabase.functions.invoke('chat-with-claude', {
        body: {
          message: content,
          agentPrompt: enhancedPrompt,
          chatHistory: activeSession.messages.slice(-10).map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          agentName: selectedAgent.name,
          isCustomAgent,
          customAgentId: isCustomAgent ? selectedAgent.id.replace('custom-', '') : null,
          productId: selectedProductId,
          userId: user?.id
        }
      });

      // Remover toast de loading
      toast.dismiss(loadingToast);

      console.log('📥 DEBUG - Resposta da função:', { 
        hasData: !!data, 
        hasError: !!error,
        dataKeys: data ? Object.keys(data) : [],
        contextPreserved: data?.contextPreserved
      });

      if (error) {
        console.error('❌ Error calling chat function:', error);
        
        // Tratamento otimizado de erros
        let errorMessage = 'Erro temporário no chat. Tente novamente em alguns instantes.';
        
        if (error.message?.includes('Rate limit exceeded') || error.message?.includes('rate limit')) {
          errorMessage = '🚦 Muitas mensagens rapidamente. Aguarde 30 segundos e tente novamente.';
        } else if (error.message?.includes('network') || error.message?.includes('conectividade') || 
                   error.message?.includes('Failed to fetch')) {
          errorMessage = '🌐 Problema de conexão. Verifique sua internet e tente novamente.';
        } else if (error.message?.includes('503') || error.message?.includes('indisponível') || 
                   error.message?.includes('502')) {
          errorMessage = '🔧 Serviço temporariamente indisponível. Tente novamente em 2 minutos.';
        } else if (error.message?.includes('Payload muito grande') || error.message?.includes('muito extensa')) {
          errorMessage = '📝 Contexto muito extenso. Tente uma pergunta mais específica.';
        }
        
        if (isAdmin) {
          console.log('🔧 Debug admin - Erro detectado:', error);
          errorMessage += ` (Admin - Detalhes: ${error.message})`;
        }
        
        toast.error(errorMessage);
        return;
      }

      // Validação robusta da resposta
      if (!data) {
        console.error('❌ DEBUG - Resposta vazia da função');
        toast.error('❌ Erro: Resposta vazia do servidor');
        return;
      }

      // Verificar se há erro na resposta
      if (data.error) {
        console.error('❌ DEBUG - Erro na resposta:', data.error);
        
        let errorMessage = 'Erro temporário no chat. Tente novamente.';
        
        if (data.error.includes('sobrecarregada')) {
          errorMessage = '⏰ A IA está sobrecarregada. Tente uma pergunta mais direta ou aguarde 30 segundos.';
        } else if (data.error.includes('Rate limit')) {
          errorMessage = '🚦 Muitas requisições simultâneas. Aguarde 10 segundos.';
        } else if (data.retryable === false) {
          errorMessage = '⚙️ Erro de configuração. Entre em contato com o suporte.';
        } else if (data.error.includes('indisponível') || data.error.includes('503') || data.error.includes('502')) {
          errorMessage = '🔧 Serviço temporariamente indisponível. Tente novamente em 1 minuto.';
        } else if (data.error.includes('Contexto muito extenso')) {
          errorMessage = '📝 Contexto muito longo. Tente ser mais conciso ou divida em partes.';
        }
        
        if (isAdmin) {
          errorMessage += ` (${data.details || data.error})`;
        }
        
        toast.error(errorMessage);
        return;
      }

      // Validar se a resposta contém o campo correto
      const aiResponseText = data.response || data.generatedCopy || data.text;
      if (!aiResponseText || typeof aiResponseText !== 'string') {
        console.error('❌ DEBUG - Resposta inválida:', data);
        toast.error('❌ Erro: Resposta inválida do servidor');
        return;
      }

      const assistantMessageId = crypto.randomUUID();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: aiResponseText,
        timestamp: new Date()
      };

      console.log('📨 DEBUG - Resposta processada com sucesso:', {
        messageId: assistantMessageId,
        responseLength: aiResponseText.length,
        hadProductContext: !!productContext,
        contextPreserved: data.contextPreserved
      });

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

      // Toast de sucesso otimizado
      if (data.tokensUsed) {
        console.log(`✅ Resposta gerada usando ${data.tokensUsed} tokens`);
        
        const getTokenIcon = (tokens: number) => {
          if (tokens > 4000) return '🔥';
          if (tokens > 2000) return '⚡';
          return '✨';
        };

        const tokenIcon = getTokenIcon(data.tokensUsed);
        
        const contextMessage = productContext 
          ? `Análise com contexto do produto ${productDetails?.name}`
          : 'Análise completa da documentação';
        
        toast.success(`${tokenIcon} Processamento completo!`, {
          description: `${data.tokensUsed.toLocaleString()} tokens • ${contextMessage}`,
          duration: 5000,
        });
      }

    } catch (error) {
      console.error('💥 Chat error:', error);
      
      // Tratamento de erro otimizado
      let errorMessage = '❌ Erro ao processar mensagem. Tente novamente.';
      
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = '🌐 Problema de conexão. Verifique sua internet e tente novamente.';
        } else if (error.message.includes('abort')) {
          errorMessage = '🛑 Requisição cancelada. Tente novamente.';
        }
        
        if (isAdmin) {
          errorMessage += ` (Erro técnico: ${error.message})`;
        }
      }
      
      toast.error(errorMessage);
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
