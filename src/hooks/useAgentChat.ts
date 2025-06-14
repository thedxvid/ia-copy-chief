
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatHistory {
  [agentId: string]: Message[];
}

export const useAgentChat = (agentId: string) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(`chat-${agentId}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const saveToStorage = useCallback((msgs: Message[]) => {
    localStorage.setItem(`chat-${agentId}`, JSON.stringify(msgs));
  }, [agentId]);

  const triggerWebhook = useCallback(async (userMessage: string, agentName: string) => {
    try {
      const webhookUrl = 'https://n8n.srv830837.hstgr.cloud/webhook-test/chat-user-message';
      
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify({
          message: userMessage,
          agentId: agentId,
          agentName: agentName,
          userId: user?.id || 'anonymous',
          timestamp: new Date().toISOString(),
          source: 'agent-chat',
          sessionId: `chat_${agentId}_${Date.now()}`,
          messageCount: messages.length + 1
        }),
      });

      console.log('N8n webhook triggered successfully for agent:', agentName);
    } catch (error) {
      console.error('Error triggering N8n webhook:', error);
    }
  }, [agentId, user?.id, messages.length]);

  const sendMessage = useCallback(async (content: string, agentPrompt: string, agentName?: string, isCustomAgent?: boolean) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => {
      const updated = [...prev, userMessage];
      saveToStorage(updated);
      return updated;
    });

    // Disparar webhook N8n quando usuário envia mensagem
    if (agentName) {
      triggerWebhook(content, agentName);
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/chat-with-claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          agentPrompt,
          chatHistory: messages,
          agentName: agentName || 'Agente IA',
          isCustomAgent: isCustomAgent || false,
          userId: user?.id
        }),
      });

      if (!response.ok) {
        throw new Error('Falha na comunicação com o agente');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => {
        const updated = [...prev, assistantMessage];
        saveToStorage(updated);
        return updated;
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente em alguns segundos.',
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => {
        const updated = [...prev, errorMessage];
        saveToStorage(updated);
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, saveToStorage, triggerWebhook, user?.id]);

  const clearChat = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(`chat-${agentId}`);
  }, [agentId]);

  const exportChat = useCallback((agentName: string) => {
    const chatContent = messages.map(msg => 
      `${msg.role === 'user' ? 'Você' : agentName}: ${msg.content}`
    ).join('\n\n');
    
    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversa-${agentName}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [messages]);

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
    exportChat
  };
};
