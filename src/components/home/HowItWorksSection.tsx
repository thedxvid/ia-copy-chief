
import React from 'react';

export function HowItWorksSection() {
  const steps = [
    {
      step: 1,
      title: 'Responda o Quiz Estratégico',
      description: '8 perguntas inteligentes sobre seu produto, público-alvo e objetivos de vendas',
      gradient: 'from-blue-500 to-purple-600',
      time: '2 min'
    },
    {
      step: 2,
      title: 'IA Gera Copy Personalizada',
      description: 'Nossa inteligência artificial cria anúncios e roteiros únicos para seu negócio',
      gradient: 'from-purple-500 to-pink-600',
      time: '30 seg'
    },
    {
      step: 3,
      title: 'Use e Multiplique Vendas',
      description: 'Copie, personalize e use suas copies em qualquer plataforma de marketing',
      gradient: 'from-pink-500 to-red-600',
      time: 'Imediato'
    }
  ];

  return (
    <section className="py-32 px-4 relative bg-gray-900">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 to-black/50 animate-fade-in" />
      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-20 animate-fade-in-up">
          <h2 className="text-5xl md:text-6xl font-bold mb-8 text-white">
            Como Funciona
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 animate-fade-in-up animate-stagger-1">
            Três passos simples para copies que convertem como nunca
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((item, index) => (
            <div key={index} className={`text-center group animate-fade-in-up animate-stagger-${index + 1}`}>
              <div className={`w-24 h-24 bg-gradient-to-r ${item.gradient} rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg relative`}>
                <span className="text-white font-bold text-3xl">{item.step}</span>
                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                  {item.time}
                </div>
              </div>
              <h3 className="font-bold text-2xl mb-4 text-white group-hover:text-blue-400 transition-colors">
                {item.title}
              </h3>
              <p className="text-gray-300 leading-relaxed text-lg max-w-sm mx-auto">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
