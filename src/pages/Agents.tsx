
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, MessageSquare, Zap, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Agents = () => {
  const agents = [
    {
      name: 'Agente Copy',
      description: 'Especialista em criação de copies persuasivas para anúncios e vendas',
      icon: MessageSquare,
      status: 'Ativo',
      tasks: 156
    },
    {
      name: 'Agente Headlines',
      description: 'Focado em criar headlines impactantes que chamam atenção',
      icon: Zap,
      status: 'Ativo',
      tasks: 89
    },
    {
      name: 'Agente Scripts',
      description: 'Especializado em roteiros para vídeos de vendas e apresentações',
      icon: Bot,
      status: 'Treinando',
      tasks: 23
    }
  ];

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
                <Button size="sm" className="bg-[#3B82F6] hover:bg-[#2563EB] text-white">
                  Configurar
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
    </div>
  );
};

export default Agents;
