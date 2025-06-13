
import React from 'react';
import { Bot } from 'lucide-react';

interface TypingIndicatorProps {
  agentName: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ agentName }) => {
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-8 h-8 bg-[#3B82F6] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
        <Bot className="w-4 h-4 text-white" />
      </div>
      
      <div className="max-w-[70%]">
        <div className="rounded-2xl px-4 py-3 bg-[#2A2A2A] border border-[#4B5563]/20">
          <div className="flex items-center space-x-1">
            <span className="text-[#888888] text-sm">{agentName} está pensando</span>
            <div className="flex space-x-1 ml-2">
              <div className="w-1 h-1 bg-[#3B82F6] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1 h-1 bg-[#3B82F6] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1 h-1 bg-[#3B82F6] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
        <div className="mt-1 text-xs text-[#888888]">
          Gerando resposta...
        </div>
      </div>
    </div>
  );
};
