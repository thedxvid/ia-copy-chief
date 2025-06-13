
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Clock, Shield, Zap } from 'lucide-react';
import { ModernButton } from '@/components/ui/modern-button';

export function CTASection() {
  const urgencyFeatures = [
    { icon: Clock, text: 'Setup em menos de 5 minutos' },
    { icon: Shield, text: '30 dias de garantia total' },
    { icon: Zap, text: 'Suporte prioritário incluído' }
  ];

  return (
    <section className="py-32 px-4 relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Floating shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float animate-stagger-3" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float animate-stagger-2" />
      </div>

      <div className="relative max-w-6xl mx-auto text-center animate-fade-in-up">
        <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight animate-fade-in-up">
          Pronto para Revolucionar
          <span className="block">suas Vendas?</span>
        </h2>
        
        <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-4xl mx-auto leading-relaxed animate-fade-in-up animate-stagger-1">
          Junte-se a mais de <span className="font-bold text-yellow-300">10.000 empresas</span> que já transformaram 
          seus resultados com nossa IA de copywriting.
        </p>

        <div className="flex flex-wrap justify-center gap-6 mb-12 animate-fade-in-up animate-stagger-2">
          {urgencyFeatures.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
              <feature.icon className="w-5 h-5 text-white" />
              <span className="text-white font-medium">{feature.text}</span>
            </div>
          ))}
        </div>
        
        <div className="space-y-6 animate-fade-in-up animate-stagger-3">
          <ModernButton 
            size="lg" 
            variant="glass" 
            className="text-xl px-12 py-6 group modern-button bg-white/20 text-white border-white/30 hover:bg-white/30" 
            asChild
          >
            <Link to="/quiz" className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              Começar Meu Quiz Gratuito Agora
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </ModernButton>
          
          <p className="text-white/80 text-sm">
            ✨ Sem cartão de crédito • ✨ Sem compromisso • ✨ Resultados garantidos
          </p>
        </div>
      </div>
    </section>
  );
}
