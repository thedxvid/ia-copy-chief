
import React, { createContext, useContext, ReactNode } from 'react';
import { useFloatingChat } from '@/hooks/useFloatingChat';

type ChatStep = 'closed' | 'agent-selection' | 'chatting';

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: any;
  prompt: string;
  isCustom?: boolean;
  isDefault?: boolean;
}

interface OpenAgent extends Agent {
  isMinimized: boolean;
  unreadCount: number;
  lastActivity: number;
}

interface FloatingChatContextType {
  chatStep: ChatStep;
  openAgents: OpenAgent[];
  activeAgentId: string | null;
  openAgentSelection: () => void;
  selectAgent: (agent: Agent) => void;
  backToSelection: () => void;
  closeChat: () => void;
  closeAgent: (agentId: string) => void;
  minimizeAgent: (agentId: string) => void;
  maximizeAgent: (agentId: string) => void;
  incrementUnread: (agentId: string) => void;
  focusAgent: (agentId: string) => void;
}

const FloatingChatContext = createContext<FloatingChatContextType | undefined>(undefined);

export const useFloatingChatContext = () => {
  const context = useContext(FloatingChatContext);
  if (!context) {
    throw new Error('useFloatingChatContext must be used within a FloatingChatProvider');
  }
  return context;
};

interface FloatingChatProviderProps {
  children: ReactNode;
}

export const FloatingChatProvider: React.FC<FloatingChatProviderProps> = ({ children }) => {
  const chatState = useFloatingChat();

  return (
    <FloatingChatContext.Provider value={chatState}>
      {children}
    </FloatingChatContext.Provider>
  );
};
