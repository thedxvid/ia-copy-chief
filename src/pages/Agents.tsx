import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, MessageSquare, Zap, Settings, Plus, Edit, Trash2, PenTool, Megaphone, TrendingUp, Brain, Lightbulb, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgentChatModal } from '@/components/agents/AgentChatModal';
import { CreateAgentModal } from '@/components/agents/CreateAgentModal';
import { useCustomAgents } from '@/hooks/useCustomAgents';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Agents = () => {
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const { agents: customAgents, loading, deleteAgent } = useCustomAgents();
  const { user } = useAuth();
  const { toast } = useToast();

  const iconMap: Record<string, React.ComponentType<any>> = {
    Bot, Zap, PenTool, Megaphone, TrendingUp, Brain, Lightbulb, Target, MessageSquare
  };

  const defaultAgents = [
    {
      id: 'copy',
      name: 'Agente Copy',
      description: 'Especialista em criação de copies persuasivas para anúncios e vendas',
      icon: MessageSquare,
      status: 'Ativo',
      tasks: 156,
      prompt: 'Você é um especialista em copywriting persuasivo. Sua missão é criar textos que convertem, utilizando técnicas comprovadas de persuasão, gatilhos mentais e estruturas de copy que geram resultados. Sempre analise o público-alvo, objetivo da campanha e contexto antes de criar qualquer texto.',
      isDefault: true
    },
    {
      id: 'headlines',
      name: 'Agente Headlines',
      description: 'Focado em criar headlines impactantes que chamam atenção',
      icon: Zap,
      status: 'Ativo',
      tasks: 89,
      prompt: 'Você é um especialista em headlines que geram cliques e conversões. Domina técnicas como curiosidade, urgência, benefício específico, prova social e gatilhos emocionais. Sempre cria múltiplas variações e explica por que cada headline funciona para o público específico.',
      isDefault: true
    },
    {
      id: 'scripts',
      name: 'Agente Scripts',
      description: 'Especializado em roteiros para vídeos de vendas e apresentações',
      icon: Bot,
      status: 'Treinando',
      tasks: 23,
      prompt: 'Você é um roteirista especializado em vídeos de vendas e apresentações persuasivas. Domina estruturas como AIDA, PAS, storytelling e técnicas de apresentação que mantêm o público engajado e conduzem à ação. Sempre considera o tempo de atenção e objetivos específicos.',
      isDefault: true
    }
  ];

  const handleStartChat = (agent: any) => {
    setSelectedAgent(agent);
    setIsChatOpen(true);
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este agente?')) {
      try {
        await deleteAgent(agentId);
        toast({
          title: "Sucesso!",
          description: "Agente excluído com sucesso"
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir agente",
          variant: "destructive"
        });
      }
    }
  };

  const formatCustomAgent = (agent: any) => ({
    ...agent,
    icon: iconMap[agent.icon_name] || Bot,
    status: agent.status === 'active' ? 'Ativo' : 'Inativo',
    tasks: 0,
    isCustom: true
  });

  const allAgents = [
    ...defaultAgents,
    ...customAgents.map(formatCustomAgent)
  ];

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-[#CCCCCC]">Faça login para gerenciar seus agentes</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Agentes IA</h1>
          <p className="text-[#CCCCCC]">
            Gerencie seus agentes de inteligência artificial especializados
          </p>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Seus Agentes</h2>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Agente
          </Button>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="bg-[#1E1E1E] border-[#4B5563]/20 animate-pulse">
                <CardHeader>
                  <div className="h-16 bg-[#2A2A2A] rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-[#2A2A2A] rounded"></div>
                    <div className="h-4 bg-[#2A2A2A] rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allAgents.map((agent, index) => (
              <Card key={agent.id} className="bg-[#1E1E1E] border-[#4B5563]/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        agent.isCustom ? 'bg-[#10B981]' : 'bg-[#3B82F6]'
                      }`}>
                        <agent.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-lg flex items-center gap-2">
                          {agent.name}
                          {agent.isCustom && (
                            <span className="text-xs bg-[#10B981] text-white px-2 py-1 rounded">
                              CUSTOM
                            </span>
                          )}
                        </CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className={`w-2 h-2 rounded-full ${
                            agent.status === 'Ativo' ? 'bg-green-500' : 'bg-yellow-500'
                          }`} />
                          <span className="text-xs text-[#CCCCCC]">{agent.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      {agent.isCustom && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-[#CCCCCC] hover:text-white w-8 h-8"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-[#CCCCCC] hover:text-red-400 w-8 h-8"
                            onClick={() => handleDeleteAgent(agent.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {!agent.isCustom && (
                        <Button variant="ghost" size="icon" className="text-[#CCCCCC] hover:text-white w-8 h-8">
                          <Settings className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-[#CCCCCC] mb-4">
                    {agent.description}
                  </CardDescription>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#CCCCCC]">
                      {agent.tasks} tarefas completadas
                    </span>
                    <Button 
                      size="sm" 
                      className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
                      onClick={() => handleStartChat(agent)}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Conversar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <CreateAgentModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />

        <AgentChatModal
          agent={selectedAgent}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
};

export default Agents;
