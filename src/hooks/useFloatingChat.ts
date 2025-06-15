
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
      promptLength: agent.prompt?.length || 0,
      isCustom: agent.isCustom || false,
      isDefault: agent.isDefault || false
    });

    // Validação crítica do prompt
    if (!agent.prompt || agent.prompt.trim().length === 0) {
      console.error('❌ ERRO CRÍTICO: Agente sem prompt válido!', agent);
      throw new Error('Agente não possui instruções configuradas');
    }

    console.log('✅ Prompt validado com sucesso');

    // Verificar se o agente já está aberto
    const existingAgent = openAgents.find(a => a.id === agent.id);
    
    if (existingAgent) {
      console.log('📋 Agente já existe, maximizando...');
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
      setOpenAgents(prev => {
        const newAgent: OpenAgent = {
          ...agent,
          isMinimized: false,
          unreadCount: 0,
          lastActivity: Date.now()
        };
        
        if (prev.length >= 3) {
          const sortedByActivity = [...prev].sort((a, b) => a.lastActivity - b.lastActivity);
          console.log('⚠️ Limite de 3 chats atingido, removendo o mais antigo');
          return [...sortedByActivity.slice(1), newAgent];
        }
        
        console.log('📝 Adicionando novo agente à lista');
        return [...prev, newAgent];
      });
      setActiveAgentId(agent.id);
    }
    
    console.log('🔄 Mudando chatStep para "chatting"');
    setChatStep('chatting');
    
    console.log('✅ selectAgent executado com sucesso!');
    console.log('Estado final esperado:', {
      chatStep: 'chatting',
      activeAgentId: agent.id,
      shouldShowChat: true
    });
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
