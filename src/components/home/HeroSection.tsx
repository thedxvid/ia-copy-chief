import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Check } from 'lucide-react';
import { ModernButton } from '@/components/ui/modern-button';
import { useTypewriter } from '@/hooks/useTypewriter';
export function HeroSection() {
  const typewriterText = useTypewriter({
    words: ['Copy Persuasiva', 'Vendas Online', 'Marketing Digital', 'Conversões', 'Anúncios Pagos', 'Landing Pages'],
    typeSpeed: 120,
    deleteSpeed: 80,
    delayBetweenWords: 2500
  });
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
  return <section className="relative min-h-screen flex items-center justify-center px-3 sm:px-4 bg-[#121212] overflow-hidden">
      {/* Enhanced animated background */}
      <div className="absolute inset-0 bg-[#121212]">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E1E1E]/50 to-transparent" />
        
        {/* Animated grid pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_24%,rgba(59,130,246,0.1)_25%,rgba(59,130,246,0.1)_26%,transparent_27%,transparent_74%,rgba(59,130,246,0.1)_75%,rgba(59,130,246,0.1)_76%,transparent_77%,transparent),linear-gradient(0deg,transparent_24%,rgba(59,130,246,0.1)_25%,rgba(59,130,246,0.1)_26%,transparent_27%,transparent_74%,rgba(59,130,246,0.1)_75%,rgba(59,130,246,0.1)_76%,transparent_77%,transparent)] bg-[length:50px_50px] animate-pulse" />
        </div>
        
        {/* Moving particles */}
        <div className="absolute inset-0">
          <div className="absolute top-[10%] left-[10%] w-2 h-2 bg-[#3B82F6] rounded-full animate-ping" style={{
          animationDelay: '0s'
        }} />
          <div className="absolute top-[20%] right-[15%] w-1 h-1 bg-[#2563EB] rounded-full animate-ping" style={{
          animationDelay: '1s'
        }} />
          <div className="absolute top-[60%] left-[5%] w-1.5 h-1.5 bg-[#3B82F6] rounded-full animate-ping" style={{
          animationDelay: '2s'
        }} />
          <div className="absolute bottom-[30%] right-[10%] w-2 h-2 bg-[#2563EB] rounded-full animate-ping" style={{
          animationDelay: '3s'
        }} />
          <div className="absolute top-[80%] left-[80%] w-1 h-1 bg-[#3B82F6] rounded-full animate-ping" style={{
          animationDelay: '4s'
        }} />
        </div>
      </div>
      
      {/* Enhanced floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-4 sm:left-10 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-r from-[#3B82F6]/20 to-[#2563EB]/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-32 sm:top-40 right-4 sm:right-20 w-32 sm:w-48 h-32 sm:h-48 bg-gradient-to-l from-[#2563EB]/15 to-[#3B82F6]/5 rounded-full blur-3xl animate-float animate-stagger-2" />
        <div className="absolute bottom-24 sm:bottom-32 left-1/4 w-28 sm:w-40 h-28 sm:h-40 bg-gradient-to-t from-[#3B82F6]/20 to-transparent rounded-full blur-3xl animate-float animate-stagger-4" />
        <div className="absolute top-1/2 right-1/3 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-bl from-[#2563EB]/10 to-transparent rounded-full blur-2xl animate-float animate-stagger-3" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto text-center px-2">
        <div className="animate-fade-in-up">
          <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-[#FFFFFF] mb-6 sm:mb-8 leading-tight animate-fade-in-up animate-stagger-1">
            O Futuro da Criação de
            <span className="bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1E40AF] bg-clip-text text-transparent block mt-2 animate-fade-in-up animate-stagger-2 min-h-[1.2em]">
              {typewriterText}
              <span className="animate-pulse">|</span>
            </span>
          </h2>
          
          <p className="text-lg sm:text-xl md:text-2xl text-[#CCCCCC] mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed animate-fade-in-up animate-stagger-3 px-2 lg:text-xl">
            Transforme suas vendas com IA avançada. Nossa plataforma gera copies de alta conversão 
            baseadas em estratégias comprovadas de grandes marcas. 
            <span className="text-[#3B82F6] font-semibold block mt-2">
              Sem enrolação. Só resultados que convertem.
            </span>
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-12 sm:mb-16 animate-fade-in-up animate-stagger-4 px-2">
            <ModernButton asChild size="lg" variant="gradient" className="group bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-[#FFFFFF] text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4 rounded-full font-medium transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#3B82F6]/30 w-full sm:w-auto">
              <Link to="/quiz" className="flex items-center justify-center gap-3">
                <Sparkles className="w-4 sm:w-5 h-4 sm:h-5 group-hover:rotate-12 transition-transform" />
                Começar Agora
                <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </ModernButton>
            
            <Link to="/dashboard" className="text-[#CCCCCC] hover:text-[#3B82F6] text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4 rounded-full font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:bg-white/5 backdrop-blur-sm border border-transparent hover:border-[#3B82F6]/30 w-full sm:w-auto text-center">
              Ver Dashboard
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 text-sm animate-fade-in-up animate-stagger-5 px-2">
            {benefits.map((item, index) => <div key={index} className={`flex items-center justify-center gap-3 p-4 sm:p-6 bg-[#1E1E1E]/80 backdrop-blur-sm border border-[#4B5563]/30 rounded-2xl animate-fade-in-up animate-stagger-${index + 1} hover:scale-105 transition-all duration-300 hover:border-[#3B82F6]/50 hover:shadow-lg hover:shadow-[#3B82F6]/10`}>
                <item.icon className="w-5 sm:w-6 h-5 sm:h-6 text-green-400 flex-shrink-0" />
                <span className="text-[#CCCCCC] font-medium text-sm sm:text-base">{item.text}</span>
              </div>)}
          </div>
        </div>
      </div>
    </section>;
}