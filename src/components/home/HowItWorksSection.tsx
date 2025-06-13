
import React from 'react';

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
    <section className="py-32 px-4 relative bg-[#1E1E1E]">
      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-20 animate-fade-in-up">
          <h2 className="text-5xl md:text-6xl font-bold mb-8 text-[#FFFFFF]">
            Como Funciona
          </h2>
          <p className="text-xl md:text-2xl text-[#CCCCCC] animate-fade-in-up animate-stagger-1">
            Três passos simples para copies que convertem como nunca
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((item, index) => (
            <div key={index} className={`text-center group animate-fade-in-up animate-stagger-${index + 1}`}>
              <div className={`w-24 h-24 bg-gradient-to-r ${item.gradient} rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg relative`}>
                <span className="text-[#FFFFFF] font-bold text-3xl">{item.step}</span>
                <div className="absolute -top-2 -right-2 bg-green-500 text-[#FFFFFF] text-xs px-2 py-1 rounded-full font-semibold">
                  {item.time}
                </div>
              </div>
              <h3 className="font-bold text-2xl mb-4 text-[#FFFFFF] group-hover:text-[#3B82F6] transition-colors">
                {item.title}
              </h3>
              <p className="text-[#CCCCCC] leading-relaxed text-lg max-w-sm mx-auto">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
