
import React from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const Chat = () => {
  return (
    <DashboardLayout>
      <ChatInterface />
    </DashboardLayout>
  );
};

export default Chat;
