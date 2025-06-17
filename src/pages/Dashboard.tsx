
import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MetricsCards } from '@/components/dashboard/MetricsCards';
import { AnalyticsCharts } from '@/components/dashboard/AnalyticsCharts';
import { RecentProjects } from '@/components/dashboard/RecentProjects';
import { AIInsights } from '@/components/dashboard/AIInsights';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { GoalsProgress } from '@/components/dashboard/GoalsProgress';

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in w-full max-w-full overflow-x-hidden">
        <DashboardHeader />
        
        <MetricsCards />
        
        <div className="w-full max-w-full overflow-x-hidden">
          <AnalyticsCharts />
        </div>
        
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 w-full max-w-full">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 min-w-0">
            <RecentProjects />
            <RecentActivity />
          </div>
          <div className="space-y-4 sm:space-y-6 min-w-0">
            <AIInsights />
            <QuickActions />
            <GoalsProgress />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
