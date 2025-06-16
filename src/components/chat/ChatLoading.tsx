
import React from 'react';
import { Bot } from 'lucide-react';

export const ChatLoading: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="text-center">
        <Bot className="w-12 h-12 mx-auto mb-4 text-[#3B82F6] animate-pulse" />
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-[#3B82F6] rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-[#3B82F6] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-[#3B82F6] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};
