
import React from 'react';
import { Header } from '@/components/layout/Header';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { OfferSection } from '@/components/home/OfferSection';
import { CTASection } from '@/components/home/CTASection';
import { FadeInSection } from '@/components/ui/fade-in-section';
import Footer from '@/components/layout/Footer';
import { WhatsAppFloat } from '@/components/ui/WhatsAppFloat';

const Index = () => {
  return (
    <div className="min-h-screen bg-[#121212]">
      <Header />
      
      <HeroSection />
      
      <FadeInSection delay={200}>
        <FeaturesSection />
      </FadeInSection>
      
      <FadeInSection delay={300}>
        <HowItWorksSection />
      </FadeInSection>
      
      <FadeInSection delay={400}>
        <OfferSection />
      </FadeInSection>
      
      <FadeInSection delay={500}>
        <CTASection />
      </FadeInSection>

      <Footer />
      
      {/* WhatsApp Float Button */}
      <WhatsAppFloat phoneNumber="15053066284" />
    </div>
  );
};

export default Index;
