
import React from 'react';
import { FadeInSection } from '@/components/ui/fade-in-section';

export function HowItWorksSection() {
  const steps = [
    {
      step: 1,
      title: 'Responda o Quiz Estratégico',
      description: '8 perguntas inteligentes sobre seu produto, público-alvo e objetivos de vendas',
      gradient: 'from-[#3B82F6] to-[#2563EB]',
      time: '2 min'
    },
    {
      step: 2,
      title: 'IA Gera Copy Personalizada',
      description: 'Nossa inteligência artificial cria anúncios e roteiros únicos para seu negócio',
      gradient: 'from-[#2563EB] to-[#1E40AF]',
      time: '30 seg'
    },
    {
      step: 3,
      title: 'Use e Multiplique Vendas',
      description: 'Copie, personalize e use suas copies em qualquer plataforma de marketing',
      gradient: 'from-[#1E40AF] to-[#3B82F6]',
      time: 'Imediato'
    }
  ];

  return (
    <section className="py-20 sm:py-32 px-3 sm:px-4 relative bg-[#1E1E1E]">
      <div className="relative max-w-6xl mx-auto">
        <FadeInSection>
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 sm:mb-8 text-[#FFFFFF] px-2">
              Como Funciona
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-[#CCCCCC] px-2">
              Três passos simples para copies que convertem como nunca
            </p>
          </div>
        </FadeInSection>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
          {steps.map((item, index) => (
            <FadeInSection key={index} delay={index * 150} direction="up">
              <div className="text-center group">
                <div className={`w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-r ${item.gradient} rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg relative`}>
                  <span className="text-[#FFFFFF] font-bold text-2xl sm:text-3xl">{item.step}</span>
                  <div className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 bg-[#3B82F6] text-[#FFFFFF] text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-semibold">
                    {item.time}
                  </div>
                </div>
                <h3 className="font-bold text-xl sm:text-2xl mb-3 sm:mb-4 text-[#FFFFFF] group-hover:text-[#3B82F6] transition-colors px-2">
                  {item.title}
                </h3>
                <p className="text-[#CCCCCC] leading-relaxed text-base sm:text-lg max-w-sm mx-auto px-2">
                  {item.description}
                </p>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}
