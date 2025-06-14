
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, MessageSquare, Zap, PenTool, Megaphone, TrendingUp, Brain, Lightbulb, Target } from 'lucide-react';
import { useFloatingChat } from '@/hooks/useFloatingChat';
import { useCustomAgents } from '@/hooks/useCustomAgents';
import { AgentSelector } from './AgentSelector';
import { ChatWindow } from './ChatWindow';

export const FloatingAgentChat: React.FC = () => {
  const {
    chatStep,
    selectedAgent,
    isMinimized,
    unreadCount,
    openAgentSelection,
    selectAgent,
    backToSelection,
    closeChat,
    minimizeChat,
    maximizeChat,
    incrementUnread,
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

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && chatStep !== 'closed') {
        closeChat();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [chatStep, closeChat]);

  // Don't render anything if chat is closed and not minimized
  if (chatStep === 'closed') {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={openAgentSelection}
          className="w-14 h-14 rounded-full bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-lg hover:shadow-xl transition-all duration-200 relative"
        >
          <Bot className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </div>
    );
  }

  // Minimized state - show small button with agent info
  if (isMinimized && selectedAgent) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={maximizeChat}
          className="h-12 px-4 rounded-full bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2 relative"
        >
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
            selectedAgent.isCustom ? 'bg-[#10B981]' : 'bg-[#2563EB]'
          }`}>
            <selectedAgent.icon className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-medium">{selectedAgent.name}</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {chatStep === 'agent-selection' && (
        <AgentSelector
          agents={allAgents}
          onSelectAgent={selectAgent}
          onClose={closeChat}
        />
      )}
      
      {chatStep === 'chatting' && selectedAgent && (
        <ChatWindow
          agent={selectedAgent}
          onBack={backToSelection}
          onMinimize={minimizeChat}
          onClose={closeChat}
          onNewMessage={incrementUnread}
        />
      )}
    </div>
  );
};
