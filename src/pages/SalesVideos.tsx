
import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SalesVideosPageContent } from '@/components/specialized/sales-videos/SalesVideosPageContent';

const SalesVideos = () => {
  return (
    <DashboardLayout>
      <SalesVideosPageContent />
    </DashboardLayout>
  );
};

export default SalesVideos;
