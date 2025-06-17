
import React from 'react';
import { ChatMessage } from '@/types/chat';
import { User, Bot } from 'lucide-react';

interface ChatMessagesProps {
  sessionId: string;
  onRegenerate: () => void;
  isLoading: boolean;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({ 
  sessionId, 
  onRegenerate, 
  isLoading 
}) => {
  // For now, we'll get messages from the active session via props
  // In a real implementation, you might fetch messages based on sessionId
  const messages: ChatMessage[] = [];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-[#CCCCCC]">
            <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Bem-vindo ao Chat com IA!</p>
            <p className="text-sm">Selecione um agente e comece sua conversa.</p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 bg-[#3B82F6] rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div
                className={`max-w-[80%] p-4 rounded-lg ${
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
                <div className="flex-shrink-0 w-8 h-8 bg-[#4B5563] rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[#3B82F6] rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-[#1E1E1E] text-white border border-[#4B5563] p-4 rounded-lg">
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
