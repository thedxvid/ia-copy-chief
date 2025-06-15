
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Agent } from '@/data/agents';
import { ModernButton } from '@/components/ui/modern-button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

interface DemoChatSectionProps {
  agent: Agent | undefined;
}

const TypingIndicator = () => (
  <div className="flex items-center space-x-1">
    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
  </div>
);

export const DemoChatSection = React.forwardRef<HTMLDivElement, DemoChatSectionProps>(({ agent }, ref) => {
  const [messages, setMessages] = useState<Agent['sampleMessages']>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (agent && agent.sampleMessages) {
      setMessages([]);
      
      let messageIndex = 0;
      const showNextMessage = () => {
        if (messageIndex < agent.sampleMessages.length) {
          const currentMessage = agent.sampleMessages[messageIndex];
          messageIndex++;

          if (currentMessage) {
            setIsTyping(false);
            setMessages(prev => [...prev, currentMessage]);
            
            if (currentMessage.type === 'user' && messageIndex < agent.sampleMessages.length) {
              setTimeout(() => {
                setIsTyping(true);
                setTimeout(showNextMessage, 1000); // Agent "thinks" for a second
              }, 500);
            } else {
              setTimeout(showNextMessage, 1500); // Time between agent messages
            }
          } else {
            // Skip if message is undefined and continue to the next one
            showNextMessage();
          }
        } else {
          setIsTyping(false);
        }
      };

      setTimeout(showNextMessage, 500); // Initial delay
    }
  }, [agent]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!agent) return null;

  return (
    <section id="demo-chat" ref={ref} className="py-16 sm:py-20 px-3 sm:px-4 bg-[#0F0F0F] overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-12 animate-fade-in-up">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 px-2">
            Veja o <span className="text-[#3B82F6]">{agent.name}</span> em Ação
          </h2>
          <p className="text-lg sm:text-xl text-[#CCCCCC] max-w-3xl mx-auto px-2">
            Esta é uma demonstração de como nossos agentes interagem para criar a copy perfeita para você.
          </p>
        </div>
        
        <div className="bg-[#1E1E1E]/80 backdrop-blur-sm border border-[#4B5563]/50 rounded-2xl shadow-lg overflow-hidden animate-fade-in-up">
          {/* Chat Header */}
          <div className="p-4 border-b border-[#4B5563]/50 flex items-center space-x-4 bg-[#121212]">
            <div className="w-12 h-12 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-full flex items-center justify-center shrink-0">
              <agent.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">{agent.name}</h3>
              <p className="text-[#3B82F6] text-sm font-semibold">{agent.specialty}</p>
            </div>
          </div>

          {/* Chat Body */}
          <div className="p-4 sm:p-6 h-96 overflow-y-auto space-y-6">
            {messages.map((msg, index) => (
              <div key={index} className={cn("flex items-start gap-3 animate-fade-in", msg.type === 'user' ? "justify-end" : "justify-start")}>
                {msg.type === 'agent' && (
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className="bg-[#3B82F6]">
                      <Bot className="w-4 h-4 text-white" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={cn("max-w-md p-3 rounded-2xl whitespace-pre-wrap", msg.type === 'user' ? "bg-[#3B82F6] text-white rounded-br-none" : "bg-[#2A2A2A] text-[#CCCCCC] rounded-bl-none")}>
                  {msg.content}
                </div>
                {msg.type === 'user' && (
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className="bg-gray-600">
                      <User className="w-4 h-4 text-white" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex items-start gap-3 justify-start animate-fade-in">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className="bg-[#3B82F6]">
                    <Bot className="w-4 h-4 text-white" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-[#2A2A2A] text-[#CCCCCC] p-3 rounded-2xl rounded-bl-none">
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Footer */}
          <div className="p-4 border-t border-[#4B5563]/50 text-center bg-[#121212]">
            <p className="text-[#CCCCCC] mb-4">Pronto para criar copies que vendem de verdade?</p>
            <ModernButton asChild size="lg">
              <Link to="/auth?mode=signup">
                Começar Agora
              </Link>
            </ModernButton>
          </div>
        </div>
      </div>
    </section>
  );
});

DemoChatSection.displayName = 'DemoChatSection';

