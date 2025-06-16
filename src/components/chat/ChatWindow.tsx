
import React from 'react';
import { OptimizedChatWindow } from './OptimizedChatWindow';

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: any;
  prompt: string;
  isCustom?: boolean;
}

interface ChatWindowProps {
  agent: Agent;
  onBack: () => void;
  onMinimize: () => void;
  onClose: () => void;
  onNewMessage?: () => void;
  onFocus?: () => void;
  isActive?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = (props) => {
  // Wrapper component that redirects to the optimized version
  return <OptimizedChatWindow {...props} />;
};
