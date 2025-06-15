
import React from 'react';
import { ChatWindow } from './ChatWindow';

interface OpenAgent {
  id: string;
  name: string;
  description: string;
  icon: any;
  prompt: string;
  isCustom?: boolean;
  isMinimized: boolean;
  unreadCount: number;
  lastActivity: number;
}

interface ChatWindowsProps {
  agents: OpenAgent[];
  activeAgentId: string | null;
  onBack: () => void;
  onMinimize: (agentId: string) => void;
  onClose: (agentId: string) => void;
  onNewMessage: (agentId: string) => void;
  onFocus: (agentId: string) => void;
}

export const ChatWindows: React.FC<ChatWindowsProps> = ({
  agents,
  activeAgentId,
  onBack,
  onMinimize,
  onClose,
  onNewMessage,
  onFocus
}) => {
  const activeAgents = agents.filter(agent => !agent.isMinimized);

  return (
    <div className="flex flex-col space-y-4">
      {activeAgents.map((agent, index) => (
        <div
          key={agent.id}
          className={`transition-all duration-200 ${
            activeAgentId === agent.id ? 'z-20' : 'z-10 opacity-90'
          }`}
          style={{
            transform: index > 0 ? `translateX(-${index * 20}px) translateY(-${index * 20}px)` : 'none'
          }}
        >
          <ChatWindow
            agent={agent}
            onBack={onBack}
            onMinimize={() => onMinimize(agent.id)}
            onClose={() => onClose(agent.id)}
            onNewMessage={() => onNewMessage(agent.id)}
            onFocus={() => onFocus(agent.id)}
            isActive={activeAgentId === agent.id}
          />
        </div>
      ))}
    </div>
  );
};
