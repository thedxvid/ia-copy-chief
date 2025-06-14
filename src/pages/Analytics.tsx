
import React from 'react';
import { PerformanceDashboard } from '@/components/analytics/PerformanceDashboard';

const Analytics = () => {
  return (
    <div className="space-y-6 animate-fade-in w-full max-w-full overflow-x-hidden">
      <PerformanceDashboard />
    </div>
  );
};

export default Analytics;
