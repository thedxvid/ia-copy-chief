
import React, { useState } from 'react';
import { Bot, Zap, PenTool, Megaphone, FileText, TrendingUp, Send, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

interface Agent {
  id: string;
  name: string;
  specialty: string;
  icon: React.ComponentType<any>;
  description: string;
  sampleMessages: Array<{
    type: 'user' | 'agent';
    content: string;
  }>;
}

const agents: Agent[] = [
  {
    id: 'copy',
    name: 'Copy Master',
    specialty: 'Copy Persuasiva',
    icon: PenTool,
    description: 'Especialista em copies que convertem vendas',
    sampleMessages: [
      { type: 'user', content: 'Preciso de uma copy para meu produto de skincare' },
      { type: 'agent', content: 'Perfeito! Vou criar uma copy irresistível para seu skincare. Me conta: qual é o principal benefício do seu produto?' },
      { type: 'user', content: 'Remove manchas em 7 dias' },
      { type: 'agent', content: '🎯 Aqui está sua copy:\n\n"MANCHAS INDESEJADAS? NÃO MAIS!\n\nDescubra o segredo que dermatologistas usam para transformar peles manchadas em pele de porcelana em apenas 7 dias.\n\n✨ Resultados visíveis já na primeira semana\n✨ Fórmula aprovada por dermatologistas\n✨ 30 dias de garantia total\n\nNão deixe as manchas controlarem sua autoestima. Sua pele perfeita está a 7 dias de distância!"' }
    ]
  },
  {
    id: 'headlines',
    name: 'Headlines Pro',
    specialty: 'Headlines Magnéticas',
    icon: Zap,
    description: 'Criador de títulos que param o scroll',
    sampleMessages: [
      { type: 'user', content: 'Preciso de uma headline para curso de inglês online' },
      { type: 'agent', content: 'Vou criar headlines que vão parar o scroll! Qual é o maior diferencial do seu curso?' },
      { type: 'user', content: 'Aprender inglês em 90 dias' },
      { type: 'agent', content: '🔥 Aqui estão 3 headlines irresistíveis:\n\n1. "90 Dias Para Ser Fluente: O Método Que Está Fazendo Brasileiros Falarem Inglês Como Nativos"\n\n2. "De Zero ao Inglês Fluente em 3 Meses: Descubra o Sistema Que Já Transformou 10.000+ Brasileiros"\n\n3. "PARE DE SONHAR EM INGLÊS: Este Método Te Faz Fluente em 90 Dias (Mesmo Se Você Já Tentou Tudo)"\n\nQual chama mais sua atenção?' }
    ]
  },
  {
    id: 'scripts',
    name: 'Script Master',
    specialty: 'Scripts de Vendas',
    icon: Megaphone,
    description: 'Roteiros para vídeos que vendem',
    sampleMessages: [
      { type: 'user', content: 'Quero um script para VSL de infoproduto' },
      { type: 'agent', content: 'Excelente! Vou criar um script que converte. Me diz: qual é o seu infoproduto e quem é seu público?' },
      { type: 'user', content: 'Curso de marketing digital para iniciantes' },
      { type: 'agent', content: '🎬 Script VSL estruturado:\n\n[0-15s] GANCHO:\n"Se você está cansado de ver todo mundo ganhando dinheiro online menos você... este vídeo vai mudar sua vida."\n\n[15-45s] PROBLEMA:\n"Eu sei como é frustrante... Você vê gente ganhando 10, 20, 50 mil por mês online e você aí, no zero..."\n\n[45-90s] SOLUÇÃO:\n"Eu criei um método passo-a-passo que já transformou mais de 5.000 iniciantes em profissionais do marketing digital..."\n\nContinuo com o resto?' }
    ]
  },
  {
    id: 'ads',
    name: 'Ads Genius',
    specialty: 'Anúncios Pagos',
    icon: TrendingUp,
    description: 'Textos para anúncios que convertem',
    sampleMessages: [
      { type: 'user', content: 'Preciso de copy para anúncio no Facebook' },
      { type: 'agent', content: 'Vamos criar um anúncio que vai bombar! Qual produto você quer anunciar e qual seu objetivo?' },
      { type: 'user', content: 'Curso de culinária online, quero gerar leads' },
      { type: 'agent', content: '👨‍🍳 Copy para Facebook Ads:\n\n🔥 VOCÊ ESTÁ CANSADO DE QUEIMAR A COMIDA?\n\nImagine preparar pratos dignos de restaurante na sua própria cozinha...\n\n✅ Receitas passo-a-passo\n✅ Técnicas profissionais simplificadas\n✅ Do básico ao avançado\n\n🎁 BAIXE GRÁTIS: "10 Receitas Que Impressionam" + Lista de Ingredientes\n\n[BOTÃO: QUERO MEU E-BOOK GRÁTIS]\n\n💬 Mais de 15.000 pessoas já baixaram!' }
    ]
  }
];

export function AgentsSection() {
  const { user } = useAuth();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'agent'; content: string }>>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Se o usuário estiver logado, mostrar CTA para ir para o dashboard
  if (user) {
    return (
      <section className="py-16 sm:py-20 px-3 sm:px-4 bg-gradient-to-b from-[#121212] to-[#0F0F0F]">
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

  const triggerWebhook = async (userMessage: string, agentName: string, agentId: string) => {
    try {
      const webhookUrl = 'https://n8n.srv830837.hstgr.cloud/webhook-test/chat-user-message';
      
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify({
          message: userMessage,
          agentId: agentId,
          agentName: agentName,
          timestamp: new Date().toISOString(),
          source: 'home-demo'
        }),
      });

      console.log('Demo webhook triggered for agent:', agentName);
    } catch (error) {
      console.error('Error triggering demo webhook:', error);
    }
  };

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent);
    setMessages(agent.sampleMessages);
    setChatInput('');
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() || !selectedAgent) return;

    const newUserMessage = { type: 'user' as const, content: chatInput };
    setMessages(prev => [...prev, newUserMessage]);
    
    // Disparar webhook para mensagem demo
    triggerWebhook(chatInput, selectedAgent.name, selectedAgent.id);
    
    setChatInput('');
    setIsTyping(true);

    // Simular resposta do agente
    setTimeout(() => {
      const responses = [
        "Ótima pergunta! Vou te ajudar com isso...",
        "Perfeito! Deixa eu criar algo incrível para você...",
        "Excelente! Vou usar minha expertise para resolver isso...",
        "Entendi perfeitamente! Vou criar um conteúdo que vai bombar..."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setMessages(prev => [...prev, { type: 'agent', content: randomResponse }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <section className="py-16 sm:py-20 px-3 sm:px-4 bg-gradient-to-b from-[#121212] to-[#0F0F0F]">
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
            <Card
              key={agent.id}
              className={`group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#3B82F6]/20 bg-[#1E1E1E]/80 backdrop-blur-sm border-[#4B5563]/50 hover:border-[#3B82F6]/50 rounded-2xl animate-fade-in-up animate-stagger-${index + 1} ${
                selectedAgent?.id === agent.id ? 'border-[#3B82F6] shadow-lg shadow-[#3B82F6]/30' : ''
              }`}
              onClick={() => handleAgentSelect(agent)}
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
          ))}
        </div>

        {selectedAgent && (
          <Card className="max-w-4xl mx-auto bg-[#1E1E1E]/90 backdrop-blur-sm border-[#4B5563]/50 rounded-2xl overflow-hidden animate-fade-in">
            <CardHeader className="bg-gradient-to-r from-[#3B82F6]/20 to-[#2563EB]/20 border-b border-[#4B5563]/50 p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <Avatar className="w-10 sm:w-12 h-10 sm:h-12">
                  <AvatarFallback className="bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white">
                    <selectedAgent.icon className="w-5 sm:w-6 h-5 sm:h-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-white text-lg sm:text-xl">{selectedAgent.name}</CardTitle>
                  <CardDescription className="text-[#3B82F6] text-sm sm:text-base">{selectedAgent.specialty}</CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <ScrollArea className="h-80 sm:h-96 p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-2 sm:gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.type === 'agent' && (
                        <Avatar className="w-7 sm:w-8 h-7 sm:h-8 mt-1">
                          <AvatarFallback className="bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white text-xs">
                            <selectedAgent.icon className="w-3 sm:w-4 h-3 sm:h-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div
                        className={`max-w-[85%] sm:max-w-[80%] p-2 sm:p-3 rounded-2xl ${
                          message.type === 'user'
                            ? 'bg-[#3B82F6] text-white ml-auto'
                            : 'bg-[#2A2A2A] text-[#CCCCCC] border border-[#4B5563]/50'
                        }`}
                      >
                        <p className="text-xs sm:text-sm whitespace-pre-line break-words">{message.content}</p>
                      </div>

                      {message.type === 'user' && (
                        <Avatar className="w-7 sm:w-8 h-7 sm:h-8 mt-1">
                          <AvatarFallback className="bg-[#4B5563] text-white text-xs">
                            <User className="w-3 sm:w-4 h-3 sm:h-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex gap-2 sm:gap-3 justify-start">
                      <Avatar className="w-7 sm:w-8 h-7 sm:h-8 mt-1">
                        <AvatarFallback className="bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white text-xs">
                          <selectedAgent.icon className="w-3 sm:w-4 h-3 sm:h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-[#2A2A2A] border border-[#4B5563]/50 p-2 sm:p-3 rounded-2xl">
                        <div className="flex space-x-1">
                          <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-[#3B82F6] rounded-full animate-bounce"></div>
                          <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-[#3B82F6] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-[#3B82F6] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="border-t border-[#4B5563]/50 p-3 sm:p-4">
                <div className="flex gap-2 sm:gap-3">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={`Digite sua pergunta para ${selectedAgent.name}...`}
                    className="flex-1 bg-[#2A2A2A] border-[#4B5563] text-white rounded-full text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isTyping}
                    className="bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white rounded-full px-4 sm:px-6 hover:scale-105 transition-all duration-300"
                    size="sm"
                  >
                    <Send className="w-3 sm:w-4 h-3 sm:h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
