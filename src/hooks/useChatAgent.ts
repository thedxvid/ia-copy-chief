
import { useState, useCallback } from 'react';
import { ChatMessage, Agent, ChatState } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useChatAgent = () => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    selectedAgent: null,
    isLoading: false
  });

  const selectAgent = useCallback((agent: Agent) => {
    setChatState(prev => ({
      ...prev,
      selectedAgent: agent,
      messages: [] // Reset messages when switching agents
    }));
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!chatState.selectedAgent) {
      toast.error('Selecione um agente antes de enviar uma mensagem');
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    // Add user message and set loading
    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true
    }));

    try {
      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('chat-with-claude', {
        body: {
          message: content,
          agentPrompt: chatState.selectedAgent.prompt,
          chatHistory: chatState.messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          agentName: chatState.selectedAgent.name,
          isCustomAgent: false
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

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false
      }));

    } catch (error) {
      console.error('Chat error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar mensagem');
      
      setChatState(prev => ({
        ...prev,
        isLoading: false
      }));
    }
  }, [chatState.selectedAgent, chatState.messages]);

  const clearChat = useCallback(() => {
    setChatState(prev => ({
      ...prev,
      messages: []
    }));
  }, []);

  return {
    chatState,
    selectAgent,
    sendMessage,
    clearChat
  };
};
