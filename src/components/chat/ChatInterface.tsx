
import React, { useState } from 'react';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { AgentSelector } from './AgentSelector';
import { useChatAgent } from '@/hooks/useChatAgent';
import { ProductSelector } from '@/components/ui/product-selector';

export const ChatInterface = () => {
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const {
    sessions,
    activeSession,
    createNewSession,
    selectSession,
    sendMessage,
    regenerateLastMessage,
    isLoading,
    selectedAgent,
    setSelectedAgent
  } = useChatAgent(selectedProductId);

  return (
    <div className="flex h-[calc(100vh-2rem)] bg-[#0A0A0A] text-white">
      {/* Sidebar com sessões */}
      <div className="w-80 bg-[#1A1A1A] border-r border-[#333333] flex flex-col">
        <div className="p-4 border-b border-[#333333]">
          <h2 className="text-xl font-semibold text-white mb-4">Conversas</h2>
          
          <ProductSelector
            value={selectedProductId}
            onValueChange={setSelectedProductId}
            showPreview={false}
            className="mb-4"
          />
          
          <AgentSelector
            selectedAgent={selectedAgent}
            onAgentChange={setSelectedAgent}
          />
          
          <button
            onClick={createNewSession}
            className="w-full mt-4 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg transition-colors"
          >
            Nova Conversa
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => selectSession(session.id)}
              className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors ${
                activeSession?.id === session.id
                  ? 'bg-[#3B82F6] text-white'
                  : 'bg-[#2A2A2A] text-[#CCCCCC] hover:bg-[#333333]'
              }`}
            >
              <div className="font-medium text-sm">
                {session.title || 'Nova conversa'}
              </div>
              <div className="text-xs opacity-70 mt-1">
                {new Date(session.created_at).toLocaleDateString('pt-BR')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Área principal do chat */}
      <div className="flex-1 flex flex-col">
        {activeSession ? (
          <>
            <ChatMessages
              sessionId={activeSession.id}
              onRegenerate={regenerateLastMessage}
              isLoading={isLoading}
            />
            <ChatInput
              onSendMessage={sendMessage}
              isLoading={isLoading}
              disabled={!activeSession}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-[#666666]">
              <h3 className="text-xl font-medium mb-2">Bem-vindo ao Chat IA</h3>
              <p>Selecione um agente e crie uma nova conversa para começar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
