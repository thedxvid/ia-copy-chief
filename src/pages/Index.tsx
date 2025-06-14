
import React from 'react';
import { HeroSection } from '@/components/home/HeroSection';
import { AgentsSection } from '@/components/home/AgentsSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { OfferSection } from '@/components/home/OfferSection';
import { CTASection } from '@/components/home/CTASection';

const Index = () => {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#121212]">
      <HeroSection />
      <AgentsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <OfferSection />
      <CTASection />
    </div>
  );
};

export default Index;
