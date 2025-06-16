
import React from 'react';
import { Agent } from '@/types/chat';
import { chatAgents } from '@/data/chatAgents';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AgentSelectorProps {
  selectedAgent: Agent | null;
  onSelectAgent: (agent: Agent) => void;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  selectedAgent,
  onSelectAgent
}) => {
  return (
    <div className="w-full max-w-md">
      <label className="block text-sm font-medium text-white mb-2">
        Escolha um Agente de IA
      </label>
      <Select
        value={selectedAgent?.id || ''}
        onValueChange={(value) => {
          const agent = chatAgents.find(a => a.id === value);
          if (agent) onSelectAgent(agent);
        }}
      >
        <SelectTrigger className="bg-[#1E1E1E] border-[#4B5563] text-white">
          <SelectValue placeholder="Selecione um agente..." />
        </SelectTrigger>
        <SelectContent className="bg-[#1E1E1E] border-[#4B5563]">
          {chatAgents.map((agent) => (
            <SelectItem key={agent.id} value={agent.id} className="text-white hover:bg-[#2A2A2A]">
              <div className="flex items-center space-x-3">
                <span className="text-xl">{agent.icon}</span>
                <div>
                  <div className="font-medium">{agent.name}</div>
                  <div className="text-sm text-[#CCCCCC]">{agent.description}</div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
