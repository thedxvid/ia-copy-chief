
import React, { useEffect, useState } from 'react';
import { Bot, MessageSquare, Zap, PenTool, Megaphone, TrendingUp, Brain, Lightbulb, Target } from 'lucide-react';
import { useFloatingChat } from '@/hooks/useFloatingChat';
import { useCustomAgents } from '@/hooks/useCustomAgents';
import { useAuth } from '@/contexts/AuthContext';
import { AgentSelector } from './AgentSelector';
import { FloatingChatButton } from './FloatingChatButton';
import { MinimizedAgents } from './MinimizedAgents';
import { ChatWindows } from './ChatWindows';
import { ChatActions } from './ChatActions';

export const FloatingAgentChat: React.FC = () => {
  const { user } = useAuth();
  const [forceRender, setForceRender] = useState(0);
  
  const {
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
  } = useFloatingChat();

  const { agents: customAgents } = useCustomAgents();

  // Força re-render quando estados críticos mudam
  useEffect(() => {
    console.log('🔄 FORCE RENDER TRIGGER:', { chatStep, openAgentsCount: openAgents.length, activeAgentId });
    setForceRender(prev => prev + 1);
  }, [chatStep, openAgents.length, activeAgentId]);

  const iconMap: Record<string, React.ComponentType<any>> = {
    Bot, Zap, PenTool, Megaphone, TrendingUp, Brain, Lightbulb, Target, MessageSquare
  };

  const defaultAgents = [
    {
      id: 'copy',
      name: 'Agente Copy',
      description: 'Especialista em criação de copies persuasivas',
      icon: MessageSquare,
      prompt: 'Você é um especialista em copywriting persuasivo. Sua missão é criar textos que convertem, utilizando técnicas comprovadas de persuasão, gatilhos mentais e estruturas de copy que geram resultados. Sempre analise o público-alvo, objetivo da campanha e contexto antes de criar qualquer texto.',
      isDefault: true
    },
    {
      id: 'headlines',
      name: 'Agente Headlines',
      description: 'Focado em criar headlines impactantes',
      icon: Zap,
      prompt: 'Você é um especialista em headlines que geram cliques e conversões. Domina técnicas como curiosidade, urgência, benefício específico, prova social e gatilhos emocionais. Sempre cria múltiplas variações e explica por que cada headline funciona para o público específico.',
      isDefault: true
    },
    {
      id: 'scripts',
      name: 'Agente Scripts',
      description: 'Especializado em roteiros para vídeos de vendas',
      icon: Bot,
      prompt: 'Você é um roteirista especializado em vídeos de vendas e apresentações persuasivas. Domina estruturas como AIDA, PAS, storytelling e técnicas de apresentação que mantêm o público engajado e conduzem à ação. Sempre considera o tempo de atenção e objetivos específicos.',
      isDefault: true
    }
  ];

  const formatCustomAgent = (agent: any) => ({
    ...agent,
    icon: iconMap[agent.icon_name] || Bot,
    isCustom: true
  });

  const allAgents = [
    ...defaultAgents,
    ...customAgents.map(formatCustomAgent)
  ];

  // Debug mais completo do estado atual
  console.log('🎭 === FLOATING CHAT RENDER STATE (force:', forceRender, ') === 🎭');
  console.log('chatStep:', chatStep);
  console.log('openAgents count:', openAgents.length);
  console.log('activeAgentId:', activeAgentId);
  console.log('user:', !!user);
  
  if (openAgents.length > 0) {
    console.log('Open agents details:', openAgents.map(a => ({ id: a.id, name: a.name, minimized: a.isMinimized })));
  }

  // Só renderizar se o usuário estiver logado
  if (!user) {
    console.log('❌ User not logged in, not rendering chat');
    return null;
  }

  // Calcular total de notificações
  const totalUnreadCount = openAgents.reduce((sum, agent) => sum + agent.unreadCount, 0);

  // Debug função para limpar chats
  const clearAllChats = () => {
    if (window.confirm('⚠️ Isso irá limpar TODOS os históricos de chat. Tem certeza?')) {
      allAgents.forEach(agent => {
        localStorage.removeItem(`chat-${agent.id}`);
      });
      alert('✅ Todos os históricos foram limpos!');
    }
  };

  // LÓGICA DE RENDERIZAÇÃO SIMPLIFICADA
  console.log('🎨 RENDER DECISION:', { chatStep, openAgentsCount: openAgents.length });

  // Estado: Apenas botão principal (quando não há chats ativos)
  if (chatStep === 'closed' || (chatStep === 'chatting' && openAgents.length === 0)) {
    console.log('🔵 Rendering: Main button only');
    return (
      <FloatingChatButton
        totalUnreadCount={totalUnreadCount}
        onOpenAgentSelection={openAgentSelection}
        onClearAllChats={clearAllChats}
      />
    );
  }

  // Estado: Seleção de agentes
  if (chatStep === 'agent-selection') {
    console.log('🟡 Rendering: Agent selection modal');
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <AgentSelector
          agents={allAgents}
          onSelectAgent={selectAgent}
          onClose={closeChat}
        />
      </div>
    );
  }

  // Estado: Chat ativo (tem agentes abertos)
  if (chatStep === 'chatting' && openAgents.length > 0) {
    console.log('🟢 RENDERING CHAT INTERFACE with', openAgents.length, 'agents');
    
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="flex flex-col space-y-4">
          <MinimizedAgents 
            agents={openAgents}
            onMaximizeAgent={maximizeAgent}
          />

          <ChatWindows
            agents={openAgents}
            activeAgentId={activeAgentId}
            onBack={backToSelection}
            onMinimize={minimizeAgent}
            onClose={closeAgent}
            onNewMessage={incrementUnread}
            onFocus={focusAgent}
          />

          <ChatActions
            onOpenAgentSelection={openAgentSelection}
            onClearAllChats={clearAllChats}
          />
        </div>
      </div>
    );
  }

  // Fallback - não deveria acontecer
  console.log('🔴 Rendering: Fallback (unexpected state)', { chatStep, openAgentsLength: openAgents.length });
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-red-500 text-white p-2 rounded">
        Debug: Estado inesperado - {chatStep} / {openAgents.length}
      </div>
    </div>
  );
};
