
import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdsPageContent } from '@/components/specialized/ads/AdsPageContent';

const Ads = () => {
  return (
    <DashboardLayout>
      <AdsPageContent />
    </DashboardLayout>
  );
};

export default Ads;
