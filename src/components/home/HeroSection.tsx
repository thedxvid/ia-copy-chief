
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bot } from 'lucide-react';
import { FadeInSection } from '@/components/ui/fade-in-section';

export const HeroSection = () => {
  const handleGetStarted = () => {
    window.open('https://clkdmg.site/subscribe/iacopychief-assinatura-mensal', '_blank');
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#121212] via-[#1a1a1a] to-[#0a0a0a] overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <FadeInSection>
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-[#3B82F6] to-[#1E40AF] rounded-3xl flex items-center justify-center shadow-2xl">
                <Bot className="w-10 h-10 text-white" />
              </div>
            </div>
          </FadeInSection>
          
          <FadeInSection delay={200}>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Transforme suas ideias em
              <span className="block bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] bg-clip-text text-transparent">
                copies que vendem
              </span>
            </h1>
          </FadeInSection>
          
          <FadeInSection delay={400}>
            <p className="text-xl md:text-2xl text-[#CCCCCC] mb-8 max-w-3xl mx-auto leading-relaxed">
              A primeira plataforma de IA do Brasil especializada em copywriting. 
              Crie textos persuasivos, anúncios que convertem e conteúdo que engaja em segundos.
            </p>
          </FadeInSection>
          
          <FadeInSection delay={600}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                onClick={handleGetStarted}
                size="lg" 
                className="bg-gradient-to-r from-[#3B82F6] to-[#1E40AF] hover:from-[#2563EB] to-[#1D4ED8] text-white font-semibold px-8 py-4 text-lg shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
              >
                Começar Agora
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              
              <div className="text-sm text-[#888888]">
                + de 10.000 copies criadas
              </div>
            </div>
          </FadeInSection>
          
          <FadeInSection delay={800}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#3B82F6] mb-2">5x</div>
                <div className="text-[#CCCCCC]">Mais conversões</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#3B82F6] mb-2">90%</div>
                <div className="text-[#CCCCCC]">Menos tempo</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#3B82F6] mb-2">24/7</div>
                <div className="text-[#CCCCCC]">Sempre disponível</div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-10 w-2 h-2 bg-[#3B82F6] rounded-full animate-pulse opacity-60"></div>
      <div className="absolute top-1/3 right-20 w-1 h-1 bg-[#60A5FA] rounded-full animate-pulse opacity-40"></div>
      <div className="absolute bottom-1/4 left-1/4 w-1.5 h-1.5 bg-[#3B82F6] rounded-full animate-pulse opacity-50"></div>
    </section>
  );
};
