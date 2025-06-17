
import React from 'react';
import { Bot } from 'lucide-react';

export const ChatLoading: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <Bot className="w-8 h-8 mx-auto mb-3 text-[#3B82F6]" />
        <div className="flex items-center justify-center space-x-1">
          <div className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full animate-bounce"></div>
          <div className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <p className="text-xs text-[#CCCCCC] mt-2">Inicializando agente...</p>
      </div>
    </div>
  );
};
