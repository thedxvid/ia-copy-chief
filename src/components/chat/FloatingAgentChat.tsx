
import React, { useEffect } from 'react';
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

  // Debug detalhado do estado atual
  useEffect(() => {
    console.log('🎭 === FLOATING CHAT RENDER STATE === 🎭');
    console.log('chatStep:', chatStep);
    console.log('openAgents count:', openAgents.length);
    console.log('activeAgentId:', activeAgentId);
    console.log('user:', !!user);
    
    if (openAgents.length > 0) {
      console.log('Open agents details:', openAgents.map(a => ({ id: a.id, name: a.name, minimized: a.isMinimized })));
    }
    
    const shouldRenderChat = chatStep === 'chatting' && openAgents.length > 0;
    console.log('🔍 SHOULD RENDER CHAT?', shouldRenderChat);
    console.log('🔍 Render conditions:');
    console.log('  - chatStep === "chatting":', chatStep === 'chatting');
    console.log('  - openAgents.length > 0:', openAgents.length > 0);
  }, [chatStep, openAgents, activeAgentId, user]);

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

  console.log('🎨 RENDER DECISION - chatStep:', chatStep, 'openAgents:', openAgents.length);

  // Estado: Apenas botão principal
  if (chatStep === 'closed') {
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

  // Estado: Chat ativo
  if (chatStep === 'chatting') {
    console.log('🟢 ATTEMPTING CHAT RENDER - openAgents:', openAgents.length);
    
    // Se não há agentes abertos mas estamos em chatting, algo está errado
    if (openAgents.length === 0) {
      console.log('⚠️ CRITICAL: No open agents in chatting state!');
      console.log('⚠️ Forçando volta para closed...');
      setTimeout(() => closeChat(), 0);
      return (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-yellow-500 text-black p-2 rounded">
            Debug: Tentando corrigir estado...
          </div>
        </div>
      );
    }
    
    console.log('✅ RENDERING CHAT INTERFACE with', openAgents.length, 'agents');
    
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
