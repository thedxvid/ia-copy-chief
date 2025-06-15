
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
    console.log('🚀 selectAgent called with:', {
      id: agent.id,
      name: agent.name,
      hasPrompt: !!agent.prompt,
      isCustom: agent.isCustom || false,
      isDefault: agent.isDefault || false
    });

    // Verificar se o agente tem prompt
    if (!agent.prompt) {
      console.error('❌ ERRO: Agente sem prompt!', agent);
      return;
    }

    // Verificar se o agente já está aberto
    const existingAgent = openAgents.find(a => a.id === agent.id);
    
    if (existingAgent) {
      console.log('📋 Agente já existe, maximizando...');
      // Se já está aberto, apenas maximizar e focar
      setOpenAgents(prev => 
        prev.map(a => 
          a.id === agent.id 
            ? { ...a, isMinimized: false, unreadCount: 0, lastActivity: Date.now() }
            : a
        )
      );
      setActiveAgentId(agent.id);
    } else {
      console.log('🆕 Criando novo chat para agente...');
      // Limitar a 3 chats simultâneos
      setOpenAgents(prev => {
        const newAgent: OpenAgent = {
          ...agent,
          isMinimized: false,
          unreadCount: 0,
          lastActivity: Date.now()
        };
        
        if (prev.length >= 3) {
          // Remover o chat mais antigo (menos ativo)
          const sortedByActivity = [...prev].sort((a, b) => a.lastActivity - b.lastActivity);
          console.log('⚠️ Limite de 3 chats atingido, removendo o mais antigo');
          return [...sortedByActivity.slice(1), newAgent];
        }
        
        return [...prev, newAgent];
      });
      setActiveAgentId(agent.id);
    }
    
    setChatStep('chatting');
    console.log('✅ Chat iniciado com sucesso!');
  }, [openAgents]);

  const backToSelection = useCallback(() => {
    console.log('🔙 Voltando para seleção de agentes...');
    setChatStep('agent-selection');
    setActiveAgentId(null);
  }, []);

  const closeChat = useCallback(() => {
    console.log('❌ Fechando chat...');
    if (openAgents.length === 0) {
      setChatStep('closed');
      setActiveAgentId(null);
    } else {
      setChatStep('chatting');
    }
  }, [openAgents.length]);

  const closeAgent = useCallback((agentId: string) => {
    console.log('❌ Fechando agente:', agentId);
    setOpenAgents(prev => prev.filter(a => a.id !== agentId));
    
    if (activeAgentId === agentId) {
      const remainingAgents = openAgents.filter(a => a.id !== agentId);
      if (remainingAgents.length > 0) {
        setActiveAgentId(remainingAgents[remainingAgents.length - 1].id);
      } else {
        setChatStep('closed');
        setActiveAgentId(null);
      }
    }
  }, [activeAgentId, openAgents]);

  const minimizeAgent = useCallback((agentId: string) => {
    console.log('📉 Minimizando agente:', agentId);
    setOpenAgents(prev => 
      prev.map(a => 
        a.id === agentId ? { ...a, isMinimized: true } : a
      )
    );
    
    if (activeAgentId === agentId) {
      const otherActiveAgents = openAgents.filter(a => a.id !== agentId && !a.isMinimized);
      if (otherActiveAgents.length > 0) {
        setActiveAgentId(otherActiveAgents[otherActiveAgents.length - 1].id);
      } else {
        setActiveAgentId(null);
      }
    }
  }, [activeAgentId, openAgents]);

  const maximizeAgent = useCallback((agentId: string) => {
    console.log('📈 Maximizando agente:', agentId);
    setOpenAgents(prev => 
      prev.map(a => 
        a.id === agentId 
          ? { ...a, isMinimized: false, unreadCount: 0, lastActivity: Date.now() }
          : a
      )
    );
    setActiveAgentId(agentId);
    setChatStep('chatting');
  }, []);

  const incrementUnread = useCallback((agentId: string) => {
    setOpenAgents(prev => 
      prev.map(a => 
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
    setOpenAgents(prev => 
      prev.map(a => 
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
