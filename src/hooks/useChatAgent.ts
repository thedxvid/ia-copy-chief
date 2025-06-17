
import { useState, useCallback } from 'react';
import { ChatMessage, Agent, ChatState } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useProducts } from './useProducts';
import { formatProductContext } from '@/utils/productContext';

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  messages: ChatMessage[];
}

export const useChatAgent = (selectedProductId?: string) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { fetchProductDetails } = useProducts();

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'Nova conversa',
      created_at: new Date().toISOString(),
      messages: []
    };
    
    setSessions(prev => [newSession, ...prev]);
    setActiveSession(newSession);
  }, []);

  const selectSession = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setActiveSession(session);
    }
  }, [sessions]);

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
      messages: [...activeSession.messages, userMessage]
    };
    
    setActiveSession(updatedSession);
    setSessions(prev => prev.map(s => s.id === activeSession.id ? updatedSession : s));
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

    } catch (error) {
      console.error('Chat error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar mensagem');
    } finally {
      setIsLoading(false);
    }
  }, [selectedAgent, activeSession, selectedProductId, fetchProductDetails]);

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
    sendMessage,
    regenerateLastMessage,
    isLoading,
    selectedAgent,
    setSelectedAgent: selectAgent,
    clearChat
  };
};
