
import React from 'react';
import { Agent } from '@/types/chat';
import { chatAgents } from '@/data/chatAgents';
import { useCustomAgents } from '@/hooks/useCustomAgents';
import { Settings, Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AgentSelectorProps {
  selectedAgent: Agent | null;
  onAgentChange: (agent: Agent) => void;
  onManageAgents?: () => void;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  selectedAgent,
  onAgentChange,
  onManageAgents
}) => {
  const { customAgents, convertToAgent } = useCustomAgents();

  const allAgents: (Agent & { isCustom?: boolean })[] = [
    ...chatAgents.map(agent => ({ ...agent, isCustom: false })),
    ...customAgents.map(agent => ({ ...convertToAgent(agent), isCustom: true }))
  ];

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-white">
          Escolha um Agente de IA
        </label>
        {onManageAgents && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onManageAgents}
            className="text-[#CCCCCC] hover:text-white hover:bg-[#4B5563]/20 text-xs"
          >
            <Settings className="w-3 h-3 mr-1" />
            Gerenciar
          </Button>
        )}
      </div>
      
      <Select
        value={selectedAgent?.id || ''}
        onValueChange={(value) => {
          const agent = allAgents.find(a => a.id === value);
          if (agent) onAgentChange(agent);
        }}
      >
        <SelectTrigger className="bg-[#1E1E1E] border-[#4B5563] text-white w-full">
          <SelectValue placeholder="Selecione um agente..." />
        </SelectTrigger>
        <SelectContent className="bg-[#1E1E1E] border-[#4B5563] z-50 max-h-[300px]">
          {/* Agentes Padrão */}
          <div className="px-2 py-1">
            <div className="text-xs font-medium text-[#CCCCCC] mb-1">Agentes Padrão</div>
          </div>
          {chatAgents.map((agent) => (
            <SelectItem 
              key={agent.id} 
              value={agent.id} 
              className="text-white hover:bg-[#2A2A2A] cursor-pointer"
            >
              <div className="flex items-center space-x-3 w-full">
                <span className="text-lg flex-shrink-0">{agent.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{agent.name}</div>
                  <div className="text-xs text-[#CCCCCC] truncate">{agent.description}</div>
                </div>
              </div>
            </SelectItem>
          ))}

          {/* Agentes Personalizados */}
          {customAgents.length > 0 && (
            <>
              <div className="px-2 py-1 border-t border-[#4B5563] mt-1">
                <div className="text-xs font-medium text-[#CCCCCC] mb-1">Meus Agentes</div>
              </div>
              {customAgents.map((agent) => {
                const convertedAgent = convertToAgent(agent);
                return (
                  <SelectItem 
                    key={convertedAgent.id} 
                    value={convertedAgent.id} 
                    className="text-white hover:bg-[#2A2A2A] cursor-pointer"
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <span className="text-lg flex-shrink-0">{agent.icon_name}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{agent.name}</span>
                          <Badge variant="outline" className="text-xs border-[#3B82F6] text-[#3B82F6] bg-[#3B82F6]/10">
                            Meu
                          </Badge>
                        </div>
                        <div className="text-xs text-[#CCCCCC] truncate">
                          {agent.description || 'Agente personalizado'}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </>
          )}

          {/* Opção para criar novo agente */}
          {onManageAgents && (
            <div className="px-2 py-1 border-t border-[#4B5563] mt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onManageAgents}
                className="w-full justify-start text-[#3B82F6] hover:text-[#2563EB] hover:bg-[#3B82F6]/10"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Novo Agente
              </Button>
            </div>
          )}
        </SelectContent>
      </Select>

      {/* Indicador do agente selecionado */}
      {selectedAgent && (
        <div className="bg-[#2A2A2A] rounded-lg p-3 border border-[#4B5563]">
          <div className="flex items-center space-x-3">
            <span className="text-lg">{selectedAgent.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white text-sm">{selectedAgent.name}</span>
                {selectedAgent.id.startsWith('custom-') && (
                  <Badge variant="outline" className="text-xs border-[#3B82F6] text-[#3B82F6] bg-[#3B82F6]/10">
                    Personalizado
                  </Badge>
                )}
              </div>
              <p className="text-xs text-[#CCCCCC] mt-1">{selectedAgent.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
