
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Check } from 'lucide-react';
import { ModernButton } from '@/components/ui/modern-button';

export function HeroSection() {
  const benefits = [{
    icon: Check,
    text: 'Grátis para sempre'
  }, {
    icon: Check,
    text: 'Sem cadastro necessário'
  }, {
    icon: Check,
    text: 'Resultados instantâneos'
  }];

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 bg-[#121212]">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[#121212]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E1E1E]/50 to-transparent" />
      </div>
      
      {/* Floating elements with softer glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#3B82F6]/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-40 right-20 w-48 h-48 bg-[#2563EB]/10 rounded-full blur-3xl animate-float animate-stagger-2" />
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-[#3B82F6]/15 rounded-full blur-3xl animate-float animate-stagger-4" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        <div className="animate-fade-in-up">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-[#FFFFFF] mb-8 leading-tight animate-fade-in-up animate-stagger-1">
            O Futuro da Criação de
            <span className="bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1E40AF] bg-clip-text text-transparent block mt-2 animate-fade-in-up animate-stagger-2">
              Copy Persuasiva
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl lg:text-3xl text-[#CCCCCC] mb-12 max-w-4xl mx-auto leading-relaxed animate-fade-in-up animate-stagger-3">
            Transforme suas vendas com IA avançada. Nossa plataforma gera copies de alta conversão 
            baseadas em estratégias comprovadas de grandes marcas. 
            <span className="text-[#3B82F6] font-semibold block mt-2">
              Sem enrolação. Só resultados que convertem.
            </span>
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 animate-fade-in-up animate-stagger-4">
            <ModernButton asChild size="lg" variant="gradient" className="group bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-[#FFFFFF] text-lg px-12 py-4 rounded-2xl">
              <Link to="/quiz" className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                Criar Minha Copy Agora
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
            </ModernButton>
            
            <ModernButton variant="glass" size="lg" asChild className="bg-[#1E1E1E]/80 text-[#FFFFFF] border-[#4B5563]/50 hover:bg-[#1E1E1E] text-lg px-8 py-4 rounded-2xl">
              <Link to="/dashboard">
                Ver Dashboard
              </Link>
            </ModernButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm animate-fade-in-up animate-stagger-5">
            {benefits.map((item, index) => (
              <div key={index} className={`flex items-center justify-center gap-3 p-6 bg-[#1E1E1E]/80 backdrop-blur-sm border border-[#4B5563]/30 rounded-2xl animate-fade-in-up animate-stagger-${index + 1}`}>
                <item.icon className="w-6 h-6 text-green-400" />
                <span className="text-[#CCCCCC] font-medium text-base">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
