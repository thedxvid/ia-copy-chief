

import React from 'react';
import { ModernButton } from '@/components/ui/modern-button';
import { useTypewriter } from '@/hooks/useTypewriter';
import { FadeInSection } from '@/components/ui/fade-in-section';
import { Link } from 'react-router-dom';
import { Bot, Target, TrendingUp } from 'lucide-react';

export const HeroSection = () => {
  const typewriterText = useTypewriter(['copies que convertem', 'conteúdo envolvente', 'anúncios persuasivos', 'emails que vendem'], 2000);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#121212] via-[#1A1A1A] to-[#0A0A0A]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
      
      {/* Animated Grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_calc(50%-1px),rgba(59,130,246,0.3)_50%,transparent_calc(50%+1px))] bg-[length:100px_100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_calc(50%-1px),rgba(59,130,246,0.3)_50%,transparent_calc(50%+1px))] bg-[length:100px_100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <FadeInSection>
          <div className="flex justify-center mb-6">
            <div className="relative">
              
            </div>
          </div>
        </FadeInSection>

        <FadeInSection delay={200}>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6">
            Crie{' '}
            <span className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent">
              {typewriterText}
            </span>
            <span className="animate-pulse">|</span>
            <br />
            com Inteligência Artificial
          </h1>
        </FadeInSection>

        <FadeInSection delay={400}>
          <p className="text-lg sm:text-xl text-[#CCCCCC] mb-8 max-w-3xl mx-auto leading-relaxed">
            Transforme suas ideias em copies poderosas que convertem. Nossa IA especializada 
            em marketing digital cria conteúdo persuasivo em segundos.
          </p>
        </FadeInSection>

        <FadeInSection delay={600}>
          <div className="flex justify-center mb-12">
            <ModernButton size="lg" className="text-lg px-8 py-4 relative z-20" asChild>
              <Link to="/auth?mode=signup">
                Começar Agora
              </Link>
            </ModernButton>
          </div>
        </FadeInSection>

        <FadeInSection delay={800}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto pt-12">
            <div className="bg-[#1A1A1A]/50 backdrop-blur-sm border border-[#2A2A2A] rounded-xl p-6">
              <Target className="w-8 h-8 text-[#3B82F6] mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">Alta Conversão</h3>
              <p className="text-[#CCCCCC] text-sm">Copies otimizadas para maximizar vendas</p>
            </div>
            <div className="bg-[#1A1A1A]/50 backdrop-blur-sm border border-[#2A2A2A] rounded-xl p-6">
              <Bot className="w-8 h-8 text-[#3B82F6] mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">IA Avançada</h3>
              <p className="text-[#CCCCCC] text-sm">Tecnologia de ponta em copywriting</p>
            </div>
            <div className="bg-[#1A1A1A]/50 backdrop-blur-sm border border-[#2A2A2A] rounded-xl p-6">
              <TrendingUp className="w-8 h-8 text-[#3B82F6] mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">Resultados Rápidos</h3>
              <p className="text-[#CCCCCC] text-sm">Copies prontas em segundos</p>
            </div>
          </div>
        </FadeInSection>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-[#3B82F6]/20 to-[#8B5CF6]/20 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-gradient-to-r from-[#8B5CF6]/20 to-[#3B82F6]/20 rounded-full blur-xl animate-pulse animation-delay-2000" />
        <div className="absolute top-1/2 right-20 w-16 h-16 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-full blur-xl animate-pulse animation-delay-4000" />
      </div>
    </section>
  );
};

