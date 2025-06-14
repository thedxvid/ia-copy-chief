
import React from 'react';
import { Target, Sparkles, Zap, Brain, Users, Trophy } from 'lucide-react';
import { ModernCard } from '@/components/ui/modern-card';
import { FadeInSection } from '@/components/ui/fade-in-section';

export function FeaturesSection() {
  const features = [
    {
      icon: Brain,
      title: 'IA Estratégica Avançada',
      description: 'Sistema treinado com +50.000 campanhas de sucesso e gatilhos mentais comprovados',
      gradient: 'from-[#3B82F6] to-[#2563EB]'
    },
    {
      icon: Target,
      title: 'Quiz Inteligente de Negócio',
      description: 'Análise profunda do seu produto, público e mercado para copies ultra-personalizadas',
      gradient: 'from-[#2563EB] to-[#1E40AF]'
    },
    {
      icon: Sparkles,
      title: 'Copy de Anúncios Automática',
      description: 'Geração instantânea de headlines, descrições e CTAs que convertem',
      gradient: 'from-[#1E40AF] to-[#3B82F6]'
    },
    {
      icon: Zap,
      title: 'Roteiros de Vídeo VSL',
      description: 'Scripts persuasivos para Video Sales Letters com estruturas testadas',
      gradient: 'from-[#3B82F6] to-[#1E40AF]'
    },
    {
      icon: Users,
      title: 'Segmentação de Público',
      description: 'Identificação automática de personas e criação de mensagens direcionadas',
      gradient: 'from-[#2563EB] to-[#3B82F6]'
    },
    {
      icon: Trophy,
      title: 'Templates Premium',
      description: 'Biblioteca com +100 modelos de alta conversão para diferentes nichos',
      gradient: 'from-[#1E40AF] to-[#2563EB]'
    }
  ];

  return (
    <section className="py-20 sm:py-32 px-3 sm:px-4 relative bg-[#121212]">
      <div className="max-w-7xl mx-auto">
        <FadeInSection>
          <div className="text-center mb-16 sm:mb-24">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 sm:mb-8 text-[#FFFFFF] px-2">
              Tecnologia que
              <span className="bg-gradient-to-r from-[#3B82F6] to-[#2563EB] bg-clip-text text-transparent block sm:inline"> Revoluciona Vendas</span>
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-[#CCCCCC] max-w-3xl mx-auto px-2">
              Ferramentas profissionais de copywriting com inteligência artificial avançada
            </p>
          </div>
        </FadeInSection>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <FadeInSection key={index} delay={index * 100}>
              <ModernCard 
                variant="glass" 
                interactive 
                className="group p-6 sm:p-8 hover:shadow-2xl bg-[#1E1E1E]/60 border-[#4B5563]/30 rounded-2xl"
              >
                <div className="flex flex-col items-start space-y-3 sm:space-y-4">
                  <div className={`w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 sm:w-8 h-6 sm:h-8 text-[#FFFFFF]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg sm:text-xl mb-2 sm:mb-3 text-[#FFFFFF] group-hover:text-[#3B82F6] transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-[#CCCCCC] leading-relaxed text-sm sm:text-base">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </ModernCard>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}
