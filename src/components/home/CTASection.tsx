import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Clock, Zap } from 'lucide-react';
import { ModernButton } from '@/components/ui/modern-button';

export function CTASection() {
  const urgencyFeatures = [
    {
      icon: Clock,
      text: 'Setup em menos de 5 minutos'
    },
    {
      icon: Zap,
      text: 'Suporte prioritário incluído'
    }
  ];

  return (
    <section className="py-20 sm:py-32 px-3 sm:px-4 relative overflow-hidden bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1E40AF]">
      <div className="absolute inset-0 bg-[#121212]/20" />
      
      {/* Floating shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 sm:-top-32 -left-24 sm:-left-32 w-48 sm:w-64 h-48 sm:h-64 bg-[#FFFFFF]/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-24 sm:-bottom-32 -right-24 sm:-right-32 w-48 sm:w-64 h-48 sm:h-64 bg-[#FFFFFF]/10 rounded-full blur-3xl animate-float animate-stagger-3" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-[#FFFFFF]/5 rounded-full blur-3xl animate-float animate-stagger-2" />
      </div>

      <div className="relative max-w-6xl mx-auto text-center animate-fade-in-up">
        <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold text-[#FFFFFF] mb-6 sm:mb-8 leading-tight animate-fade-in-up px-2">
          Pronto para Revolucionar
          <span className="block">suas Vendas?</span>
        </h2>
        
        <p className="text-lg sm:text-xl md:text-2xl text-[#FFFFFF]/90 mb-6 sm:mb-8 max-w-4xl mx-auto leading-relaxed animate-fade-in-up animate-stagger-1 px-2">
          Junte-se a mais de <span className="font-bold text-[#FFFFFF]">10.000 empresas</span> que já transformaram 
          seus resultados com nossa IA de copywriting.
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-6 mb-8 sm:mb-12 animate-fade-in-up animate-stagger-2">
          {urgencyFeatures.map((feature, index) => (
            <div key={index} className="flex items-center justify-center gap-2 bg-[#FFFFFF]/10 backdrop-blur-sm rounded-2xl px-4 sm:px-6 py-2 sm:py-3">
              <feature.icon className="w-4 sm:w-5 h-4 sm:h-5 text-[#FFFFFF] flex-shrink-0" />
              <span className="text-[#FFFFFF] font-medium text-sm sm:text-base">{feature.text}</span>
            </div>
          ))}
        </div>
        
        <div className="space-y-4 sm:space-y-6 animate-fade-in-up animate-stagger-3">
          <ModernButton size="lg" variant="glass" className="text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-6 group bg-[#FFFFFF]/20 text-[#FFFFFF] border-[#FFFFFF]/30 hover:bg-[#FFFFFF]/30 rounded-2xl w-full sm:w-auto" asChild>
            <Link to="/auth?mode=signup" className="flex items-center justify-center gap-3">
              <Sparkles className="w-5 sm:w-6 h-5 sm:h-6 group-hover:rotate-12 transition-transform" />
              Começar Meu Quiz Gratuito Agora
              <ArrowRight className="w-5 sm:w-6 h-5 sm:h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </ModernButton>
        </div>
      </div>
    </section>
  );
}
