
import React from 'react';
import { Button } from '@/components/ui/button';

interface OpenAgent {
  id: string;
  name: string;
  icon: any;
  isMinimized: boolean;
  unreadCount: number;
  isCustom?: boolean;
}

interface MinimizedAgentsProps {
  agents: OpenAgent[];
  onMaximizeAgent: (agentId: string) => void;
}

export const MinimizedAgents: React.FC<MinimizedAgentsProps> = ({
  agents,
  onMaximizeAgent
}) => {
  const minimizedAgents = agents.filter(agent => agent.isMinimized);

  if (minimizedAgents.length === 0) {
    return null;
  }

  return (
    <div className="flex space-x-2 justify-end">
      {minimizedAgents.map((agent) => (
        <Button
          key={agent.id}
          onClick={() => onMaximizeAgent(agent.id)}
          className="h-10 px-3 rounded-lg bg-[#2A2A2A] hover:bg-[#3B82F6] text-white shadow-lg transition-all duration-200 flex items-center space-x-2 relative"
        >
          <div className={`w-4 h-4 rounded flex items-center justify-center ${
            agent.isCustom ? 'bg-[#10B981]' : 'bg-[#3B82F6]'
          }`}>
            <agent.icon className="w-2 h-2 text-white" />
          </div>
          <span className="text-xs font-medium truncate max-w-20">
            {agent.name}
          </span>
          {agent.unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {agent.unreadCount > 9 ? '9+' : agent.unreadCount}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
};
