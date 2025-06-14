
import { useState, useCallback } from 'react';

type ChatStep = 'closed' | 'agent-selection' | 'chatting';

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: any;
  prompt: string;
  isCustom?: boolean;
}

export const useFloatingChat = () => {
  const [chatStep, setChatStep] = useState<ChatStep>('closed');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const openAgentSelection = useCallback(() => {
    setChatStep('agent-selection');
    setIsMinimized(false);
  }, []);

  const selectAgent = useCallback((agent: Agent) => {
    setSelectedAgent(agent);
    setChatStep('chatting');
    setUnreadCount(0);
  }, []);

  const backToSelection = useCallback(() => {
    setChatStep('agent-selection');
    setSelectedAgent(null);
  }, []);

  const closeChat = useCallback(() => {
    setChatStep('closed');
    setSelectedAgent(null);
    setIsMinimized(false);
  }, []);

  const minimizeChat = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const maximizeChat = useCallback(() => {
    setIsMinimized(false);
  }, []);

  const incrementUnread = useCallback(() => {
    if (isMinimized || chatStep === 'closed') {
      setUnreadCount(prev => prev + 1);
    }
  }, [isMinimized, chatStep]);

  return {
    chatStep,
    selectedAgent,
    isMinimized,
    unreadCount,
    openAgentSelection,
    selectAgent,
    backToSelection,
    closeChat,
    minimizeChat,
    maximizeChat,
    incrementUnread,
  };
};
