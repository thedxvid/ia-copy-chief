
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AgentSelector } from './AgentSelector';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { useChatAgent } from '@/hooks/useChatAgent';
import { Trash2 } from 'lucide-react';

export const ChatInterface: React.FC = () => {
  const { chatState, selectAgent, sendMessage, clearChat } = useChatAgent();

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Chat com Agentes de IA</h1>
          <p className="text-[#CCCCCC]">Converse com especialistas em copywriting e marketing digital</p>
        </div>

        {/* Agent Selector */}
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <AgentSelector
            selectedAgent={chatState.selectedAgent}
            onSelectAgent={selectAgent}
          />
          
          {chatState.messages.length > 0 && (
            <Button
              onClick={clearChat}
              variant="outline"
              className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A]"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar Chat
            </Button>
          )}
        </div>

        {/* Selected Agent Info */}
        {chatState.selectedAgent && (
          <Card className="bg-[#1E1E1E] border-[#4B5563] mb-6">
            <div className="p-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{chatState.selectedAgent.icon}</span>
                <div>
                  <h3 className="text-white font-medium">{chatState.selectedAgent.name}</h3>
                  <p className="text-[#CCCCCC] text-sm">{chatState.selectedAgent.description}</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Chat Area */}
        <Card className="bg-[#0F0F0F] border-[#4B5563] h-[600px] flex flex-col">
          <ChatMessages 
            messages={chatState.messages} 
            isLoading={chatState.isLoading}
          />
          <ChatInput
            onSendMessage={sendMessage}
            isLoading={chatState.isLoading}
            disabled={!chatState.selectedAgent}
          />
        </Card>
      </div>
    </div>
  );
};
