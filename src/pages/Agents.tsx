
import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AgentsList } from '@/components/agents/AgentsList';

const Agents = () => {
  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <AgentsList />
      </div>
    </DashboardLayout>
  );
};

export default Agents;
