
import { useState, useCallback } from 'react';

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

export const useFloatingChat = () => {
  const [chatStep, setChatStep] = useState<ChatStep>('closed');
  const [openAgents, setOpenAgents] = useState<OpenAgent[]>([]);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);

  const openAgentSelection = useCallback(() => {
    console.log('🔧 Opening agent selection...');
    setChatStep('agent-selection');
  }, []);

  const selectAgent = useCallback((agent: Agent) => {
    console.log('🚀 === SELECT AGENT DEBUG === 🚀');
    console.log('Agent recebido:', {
      id: agent.id,
      name: agent.name,
      hasPrompt: !!agent.prompt,
      promptLength: agent.prompt?.length || 0
    });

    // Validação crítica do prompt
    if (!agent.prompt || agent.prompt.trim().length === 0) {
      console.error('❌ ERRO CRÍTICO: Agente sem prompt válido!', agent);
      throw new Error('Agente não possui instruções configuradas');
    }

    console.log('✅ Prompt validado com sucesso');

    // Atualizar estados de forma síncrona
    setOpenAgents(currentAgents => {
      console.log('📋 Current agents antes da atualização:', currentAgents.length);
      
      const existingAgent = currentAgents.find(a => a.id === agent.id);
      
      let updatedAgents: OpenAgent[];
      
      if (existingAgent) {
        console.log('📋 Agente já existe, maximizando...');
        updatedAgents = currentAgents.map(a => 
          a.id === agent.id 
            ? { ...a, isMinimized: false, unreadCount: 0, lastActivity: Date.now() }
            : a
        );
      } else {
        console.log('🆕 Criando novo chat para agente...');
        const newAgent: OpenAgent = {
          ...agent,
          isMinimized: false,
          unreadCount: 0,
          lastActivity: Date.now()
        };
        
        if (currentAgents.length >= 3) {
          const sortedByActivity = [...currentAgents].sort((a, b) => a.lastActivity - b.lastActivity);
          console.log('⚠️ Limite de 3 chats atingido, removendo o mais antigo');
          updatedAgents = [...sortedByActivity.slice(1), newAgent];
        } else {
          console.log('📝 Adicionando novo agente à lista');
          updatedAgents = [...currentAgents, newAgent];
        }
      }
      
      console.log('📋 Agentes após atualização:', updatedAgents.length);
      console.log('📋 Agentes IDs:', updatedAgents.map(a => a.id));
      
      return updatedAgents;
    });
    
    // Atualizar chatStep e activeAgentId imediatamente
    setChatStep('chatting');
    setActiveAgentId(agent.id);
    
    console.log('✅ selectAgent executado completo - mudando para chatting');
  }, []);

  const backToSelection = useCallback(() => {
    console.log('🔙 Voltando para seleção de agentes...');
    setChatStep('agent-selection');
    setActiveAgentId(null);
  }, []);

  const closeChat = useCallback(() => {
    console.log('❌ Fechando chat completamente...');
    setChatStep('closed');
    setActiveAgentId(null);
    setOpenAgents([]);
  }, []);

  const closeAgent = useCallback((agentId: string) => {
    console.log('❌ Fechando agente:', agentId);
    setOpenAgents(currentAgents => {
      const remainingAgents = currentAgents.filter(a => a.id !== agentId);
      console.log('Agentes restantes após fechar:', remainingAgents.length);
      
      // Se não há mais agentes, fechar completamente
      if (remainingAgents.length === 0) {
        setChatStep('closed');
        setActiveAgentId(null);
      } else if (activeAgentId === agentId) {
        // Se estamos fechando o agente ativo, definir novo ativo
        const newActiveId = remainingAgents[remainingAgents.length - 1].id;
        setActiveAgentId(newActiveId);
      }
      
      return remainingAgents;
    });
  }, [activeAgentId]);

  const minimizeAgent = useCallback((agentId: string) => {
    console.log('📉 Minimizando agente:', agentId);
    setOpenAgents(currentAgents => 
      currentAgents.map(a => 
        a.id === agentId ? { ...a, isMinimized: true } : a
      )
    );
    
    if (activeAgentId === agentId) {
      setActiveAgentId(null);
    }
  }, [activeAgentId]);

  const maximizeAgent = useCallback((agentId: string) => {
    console.log('📈 Maximizando agente:', agentId);
    setOpenAgents(currentAgents => 
      currentAgents.map(a => 
        a.id === agentId 
          ? { ...a, isMinimized: false, unreadCount: 0, lastActivity: Date.now() }
          : a
      )
    );
    setActiveAgentId(agentId);
    setChatStep('chatting');
  }, []);

  const incrementUnread = useCallback((agentId: string) => {
    setOpenAgents(currentAgents => 
      currentAgents.map(a => 
        a.id === agentId 
          ? { 
              ...a, 
              unreadCount: a.isMinimized || activeAgentId !== agentId ? a.unreadCount + 1 : a.unreadCount,
              lastActivity: Date.now()
            }
          : a
      )
    );
  }, [activeAgentId]);

  const focusAgent = useCallback((agentId: string) => {
    console.log('🎯 Focando agente:', agentId);
    setActiveAgentId(agentId);
    setOpenAgents(currentAgents => 
      currentAgents.map(a => 
        a.id === agentId 
          ? { ...a, lastActivity: Date.now() }
          : a
      )
    );
  }, []);

  return {
    chatStep,
    openAgents,
    activeAgentId,
    openAgentSelection,
    selectAgent,
    backToSelection,
    closeChat,
    closeAgent,
    minimizeAgent,
    maximizeAgent,
    incrementUnread,
    focusAgent,
  };
};
