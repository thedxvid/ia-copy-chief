
import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { useState } from 'react';

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: any;
  prompt: string;
  isCustom?: boolean;
}

interface AgentSelectorProps {
  agents: Agent[];
  onSelectAgent: (agent: Agent) => void;
  onClose: () => void;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  agents,
  onSelectAgent,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-[#1E1E1E] border border-[#4B5563]/20 rounded-lg shadow-xl w-80 max-h-96">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#4B5563]/20">
        <h3 className="text-lg font-semibold text-white">Escolha um Agente</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-[#CCCCCC] hover:text-white w-6 h-6"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-[#4B5563]/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#888888]" />
          <Input
            placeholder="Buscar agentes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#2A2A2A] border-[#4B5563] text-white placeholder:text-[#888888]"
          />
        </div>
      </div>

      {/* Agent List */}
      <ScrollArea className="max-h-60">
        <div className="p-2">
          {filteredAgents.length === 0 ? (
            <div className="text-center text-[#888888] py-4">
              <p>Nenhum agente encontrado</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredAgents.map((agent) => (
                <Button
                  key={agent.id}
                  variant="ghost"
                  onClick={() => onSelectAgent(agent)}
                  className="w-full p-3 h-auto justify-start text-left hover:bg-[#2A2A2A] rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      agent.isCustom ? 'bg-[#10B981]' : 'bg-[#3B82F6]'
                    }`}>
                      <agent.icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white truncate">
                          {agent.name}
                        </p>
                        {agent.isCustom && (
                          <span className="text-xs bg-[#10B981] text-white px-1.5 py-0.5 rounded">
                            CUSTOM
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#CCCCCC] truncate">
                        {agent.description}
                      </p>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
