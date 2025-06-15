
import React, { useState, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { HeroSection } from '@/components/home/HeroSection';
import { AgentsSection } from '@/components/home/AgentsSection';
import { DemoChatSection } from '@/components/home/DemoChatSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { OfferSection } from '@/components/home/OfferSection';
import { CTASection } from '@/components/home/CTASection';
import { FadeInSection } from '@/components/ui/fade-in-section';
import Footer from '@/components/layout/Footer';
import { agents } from '@/data/agents';

const Index = () => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0].id);
  const demoRef = useRef<HTMLDivElement>(null);

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgentId(agentId);
    setTimeout(() => {
      demoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100); // Small delay to ensure render before scroll
  };

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  return (
    <div className="min-h-screen bg-[#121212]">
      <Header />
      
      <HeroSection />
      
      <FadeInSection delay={100}>
        <AgentsSection
          agents={agents}
          onAgentSelect={handleAgentSelect}
          selectedAgentId={selectedAgentId}
        />
      </FadeInSection>
      
      <FadeInSection>
        <DemoChatSection ref={demoRef} agent={selectedAgent} />
      </FadeInSection>
      
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
    </div>
  );
};

export default Index;
