
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Agent } from '@/data/agents';
import { cn } from '@/lib/utils';

interface AgentsSectionProps {
  agents: Agent[];
  onAgentSelect: (agentId: string) => void;
  selectedAgentId: string | null;
}

export function AgentsSection({ agents, onAgentSelect, selectedAgentId }: AgentsSectionProps) {
  const { user } = useAuth();

  // Se o usuário estiver logado, mostrar CTA para ir para o dashboard
  if (user) {
    return (
      <section id="agents" className="py-16 sm:py-20 px-3 sm:px-4 bg-gradient-to-b from-[#121212] to-[#0F0F0F]">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-fade-in-up">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 px-2">
              Bem-vindo de volta!
              <span className="bg-gradient-to-r from-[#3B82F6] to-[#2563EB] bg-clip-text text-transparent block mt-2">
                Seus Agentes Te Aguardam
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-[#CCCCCC] max-w-3xl mx-auto px-2 mb-8">
              Acesse seu dashboard para conversar com os agentes especialistas e criar copies que convertem.
            </p>
            <Link to="/dashboard">
              <Button className="bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white px-8 py-4 text-lg rounded-full hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                Ir para o Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="agents" className="py-16 sm:py-20 px-3 sm:px-4 bg-gradient-to-b from-[#121212] to-[#0F0F0F]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16 animate-fade-in-up">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 px-2">
            Converse com Nossos
            <span className="bg-gradient-to-r from-[#3B82F6] to-[#2563EB] bg-clip-text text-transparent block mt-2">
              Agentes Especialistas
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-[#CCCCCC] max-w-3xl mx-auto px-2">
            Cada agente é especialista em uma área específica. Clique em um card e veja como eles podem te ajudar!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {agents.map((agent, index) => (
            <div key={agent.id} onClick={() => onAgentSelect(agent.id)} className="block h-full">
              <Card
                className={cn(
                  `group h-full cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#3B82F6]/20 bg-[#1E1E1E]/80 backdrop-blur-sm border-2 border-transparent hover:border-[#3B82F6]/50 rounded-2xl animate-fade-in-up`,
                  `animate-stagger-${index + 1}`,
                  selectedAgentId === agent.id && 'border-[#3B82F6] shadow-lg shadow-[#3B82F6]/30 scale-105'
                )}
              >
                <CardHeader className="text-center pb-3 sm:pb-4">
                  <div className="w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <agent.icon className="w-6 sm:w-8 h-6 sm:h-8 text-white" />
                  </div>
                  <CardTitle className="text-white text-lg sm:text-xl font-bold">{agent.name}</CardTitle>
                  <CardDescription className="text-[#3B82F6] font-semibold text-sm sm:text-base">{agent.specialty}</CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <p className="text-[#CCCCCC] text-center text-xs sm:text-sm">{agent.description}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
