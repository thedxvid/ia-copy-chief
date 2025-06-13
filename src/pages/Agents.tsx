
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, MessageSquare, Zap, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgentChatModal } from '@/components/agents/AgentChatModal';

const Agents = () => {
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const agents = [
    {
      id: 'copy',
      name: 'Agente Copy',
      description: 'Especialista em criação de copies persuasivas para anúncios e vendas',
      icon: MessageSquare,
      status: 'Ativo',
      tasks: 156,
      prompt: 'Você é um especialista em copywriting persuasivo. Sua missão é criar textos que convertem, utilizando técnicas comprovadas de persuasão, gatilhos mentais e estruturas de copy que geram resultados. Sempre analise o público-alvo, objetivo da campanha e contexto antes de criar qualquer texto.'
    },
    {
      id: 'headlines',
      name: 'Agente Headlines',
      description: 'Focado em criar headlines impactantes que chamam atenção',
      icon: Zap,
      status: 'Ativo',
      tasks: 89,
      prompt: 'Você é um especialista em headlines que geram cliques e conversões. Domina técnicas como curiosidade, urgência, benefício específico, prova social e gatilhos emocionais. Sempre cria múltiplas variações e explica por que cada headline funciona para o público específico.'
    },
    {
      id: 'scripts',
      name: 'Agente Scripts',
      description: 'Especializado em roteiros para vídeos de vendas e apresentações',
      icon: Bot,
      status: 'Treinando',
      tasks: 23,
      prompt: 'Você é um roteirista especializado em vídeos de vendas e apresentações persuasivas. Domina estruturas como AIDA, PAS, storytelling e técnicas de apresentação que mantêm o público engajado e conduzem à ação. Sempre considera o tempo de atenção e objetivos específicos.'
    }
  ];

  const handleStartChat = (agent: any) => {
    setSelectedAgent(agent);
    setIsChatOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Agentes IA</h1>
        <p className="text-[#CCCCCC]">
          Gerencie seus agentes de inteligência artificial especializados
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent, index) => (
          <Card key={index} className="bg-[#1E1E1E] border-[#4B5563]/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#3B82F6] rounded-xl flex items-center justify-center">
                    <agent.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-lg">{agent.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className={`w-2 h-2 rounded-full ${
                        agent.status === 'Ativo' ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                      <span className="text-xs text-[#CCCCCC]">{agent.status}</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-[#CCCCCC] hover:text-white">
                  <Settings className="w-4 h-4" />
                </Button>
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

      <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
        <CardHeader>
          <CardTitle className="text-white">Criar Novo Agente</CardTitle>
          <CardDescription className="text-[#CCCCCC]">
            Desenvolva um agente personalizado para suas necessidades específicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="bg-[#3B82F6] hover:bg-[#2563EB] text-white">
            <Bot className="w-4 h-4 mr-2" />
            Criar Agente
          </Button>
        </CardContent>
      </Card>

      <AgentChatModal
        agent={selectedAgent}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
};

export default Agents;
