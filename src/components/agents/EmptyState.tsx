
import React from 'react';

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: any;
  prompt: string;
  isCustom?: boolean;
}

interface ChatSession {
  id: string;
  agent_id: string;
  agent_name: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  message_count: number;
}

interface EmptyStateProps {
  agent: Agent;
  currentSession: ChatSession | null;
  hasMessages: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ agent, currentSession, hasMessages }) => {
  if (hasMessages) return null;

  return (
    <div className="text-center text-[#888888] py-8">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${
        agent.isCustom ? 'bg-[#10B981]' : 'bg-[#3B82F6]'
      }`}>
        <agent.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      </div>
      <h3 className="text-base sm:text-lg font-medium text-white mb-2">{agent.name}</h3>
      <p className="text-sm sm:text-base text-[#CCCCCC] mb-4 px-4">{agent.description}</p>
      <p className="text-xs sm:text-sm">
        {!currentSession ? 'Inicializando conversa...' : 'Como posso ajudar você hoje?'}
      </p>
    </div>
  );
};
