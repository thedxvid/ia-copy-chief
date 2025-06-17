
import React, { useState } from 'react';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { AgentSelector } from './AgentSelector';
import { useChatAgent } from '@/hooks/useChatAgent';
import { ProductSelector } from '@/components/ui/product-selector';
import { useProducts } from '@/hooks/useProducts';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Trash2 } from 'lucide-react';

export const ChatInterface = () => {
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const { products } = useProducts();
  const {
    sessions,
    activeSession,
    createNewSession,
    selectSession,
    deleteSession,
    sendMessage,
    regenerateLastMessage,
    isLoading,
    selectedAgent,
    setSelectedAgent
  } = useChatAgent(selectedProductId);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Create a custom ChatMessages component that receives messages directly
  const ChatMessagesWithData = () => {
    if (!activeSession) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-[#666666]">
            <h3 className="text-xl font-medium mb-2">Bem-vindo ao Chat IA</h3>
            <p>Selecione um agente e crie uma nova conversa para começar</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {activeSession.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-[#CCCCCC]">
              <div className="w-12 h-12 mx-auto mb-4 opacity-50">🤖</div>
              <p className="text-lg font-medium mb-2">Bem-vindo ao Chat com IA!</p>
              <p className="text-sm">Comece sua conversa digitando uma mensagem.</p>
            </div>
          </div>
        ) : (
          <>
            {activeSession.messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-[#3B82F6] rounded-2xl flex items-center justify-center">
                    <span className="text-white text-sm">🤖</span>
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] p-4 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-[#3B82F6] text-white'
                      : 'bg-[#1E1E1E] text-white border border-[#4B5563]'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <div className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-[#4B5563] rounded-2xl flex items-center justify-center">
                    <span className="text-white text-sm">👤</span>
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-[#3B82F6] rounded-2xl flex items-center justify-center">
                  <span className="text-white text-sm">🤖</span>
                </div>
                <div className="bg-[#1E1E1E] text-white border border-[#4B5563] p-4 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-[#3B82F6] rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-[#3B82F6] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-[#3B82F6] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-[#CCCCCC]">Gerando resposta...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] bg-[#0A0A0A] text-white rounded-3xl overflow-hidden">
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

          {selectedProduct && (
            <Alert className="bg-green-500/10 border-green-500/20 mb-4 rounded-2xl">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-200">
                ✅ Contexto ativo: {selectedProduct.name}
              </AlertDescription>
            </Alert>
          )}
          
          <AgentSelector
            selectedAgent={selectedAgent}
            onAgentChange={setSelectedAgent}
          />
          
          <button
            onClick={createNewSession}
            className="w-full mt-4 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-2xl transition-colors"
          >
            Nova Conversa
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`group relative p-3 mb-2 rounded-2xl cursor-pointer transition-colors ${
                activeSession?.id === session.id
                  ? 'bg-[#3B82F6] text-white'
                  : 'bg-[#2A2A2A] text-[#CCCCCC] hover:bg-[#333333]'
              }`}
            >
              <div
                onClick={() => selectSession(session.id)}
                className="flex-1"
              >
                <div className="font-medium text-sm pr-8">
                  {session.title || 'Nova conversa'}
                </div>
                <div className="text-xs opacity-70 mt-1">
                  {new Date(session.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSession(session.id);
                }}
                className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-xl transition-all duration-200"
                title="Excluir conversa"
              >
                <Trash2 className="h-3 w-3 text-red-400 hover:text-red-300" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Área principal do chat */}
      <div className="flex-1 flex flex-col">
        <ChatMessagesWithData />
        {activeSession && (
          <ChatInput
            onSendMessage={sendMessage}
            isLoading={isLoading}
            disabled={!activeSession || !selectedAgent}
          />
        )}
      </div>
    </div>
  );
};
