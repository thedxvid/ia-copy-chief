
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Star, Sparkles, Zap, Target, Brain } from 'lucide-react';
import { ModernButton } from '@/components/ui/modern-button';
import { ModernCard } from '@/components/ui/modern-card';

const Index = () => {
  const features = [
    {
      icon: Target,
      title: 'Quiz estratégico para entender seu negócio',
      description: 'Análise profunda do seu produto e mercado'
    },
    {
      icon: Sparkles,
      title: 'Geração automática de copy de anúncios',
      description: 'IA treinada em milhares de campanhas de sucesso'
    },
    {
      icon: Zap,
      title: 'Roteiros de vídeo persuasivos',
      description: 'Scripts otimizados para conversão máxima'
    },
    {
      icon: Target,
      title: 'Biblioteca de gatilhos mentais',
      description: 'Psicologia aplicada ao marketing'
    },
    {
      icon: Sparkles,
      title: 'Templates profissionais',
      description: 'Modelos testados e aprovados'
    },
    {
      icon: Zap,
      title: 'Análise de concorrentes',
      description: 'Insights competitivos em tempo real'
    }
  ];

  const testimonials = [
    {
      name: 'Maria Silva',
      role: 'E-commerce',
      content: 'Aumentei minhas vendas em 300% usando as copies geradas!',
      rating: 5,
      avatar: '👩‍💼'
    },
    {
      name: 'João Santos',
      role: 'Infoprodutor',
      content: 'O quiz estratégico me ajudou a entender melhor meu público.',
      rating: 5,
      avatar: '👨‍💻'
    },
    {
      name: 'Ana Costa',
      role: 'Agência Digital',
      content: 'Ferramenta essencial para nossa equipe de marketing.',
      rating: 5,
      avatar: '👩‍🚀'
    }
  ];

  const howItWorksSteps = [
    {
      step: 1,
      title: 'Responda o Quiz',
      description: '8 perguntas estratégicas sobre seu produto, público e objetivos',
      gradient: 'from-blue-500 to-purple-600'
    },
    {
      step: 2,
      title: 'IA Gera sua Copy',
      description: 'Nosso sistema cria anúncios e roteiros personalizados para você',
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      step: 3,
      title: 'Use e Venda Mais',
      description: 'Copie, edite e use suas copies em qualquer plataforma',
      gradient: 'from-pink-500 to-red-600'
    }
  ];

  const benefits = [
    { icon: Check, text: 'Grátis para sempre' },
    { icon: Check, text: 'Sem cadastro necessário' },
    { icon: Check, text: 'Resultados instantâneos' }
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-900">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 safe-top">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black animate-fade-in" />
        
        {/* Floating elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl animate-float" />
          <div className="absolute top-40 right-20 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl animate-float animate-stagger-2" />
          <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl animate-float animate-stagger-4" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="animate-fade-in-up">
            <div className="flex items-center justify-center mb-6 animate-fade-in-up">
              <Brain className="w-16 h-16 text-blue-400 mr-4" />
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
                CopyChief
              </h1>
            </div>
            
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight animate-fade-in-up animate-stagger-1">
              Gere Copies de Vendas
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent block mt-2 animate-fade-in-up animate-stagger-2">
                Profissionais em Minutos
              </span>
            </h2>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animate-stagger-3">
              Transforme suas ideias em copies persuasivas com nosso sistema inteligente 
              baseado em questionário estratégico. <span className="text-blue-400 font-semibold">Sem complicação, só resultados.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 animate-fade-in-up animate-stagger-4">
              <ModernButton asChild size="lg" variant="gradient" className="group modern-button bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <Link to="/quiz" className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Começar Agora
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </ModernButton>
              
              <ModernButton variant="glass" size="lg" asChild className="modern-button bg-white/10 text-white border-white/20 hover:bg-white/20">
                <Link to="/dashboard">
                  Ver Dashboard
                </Link>
              </ModernButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm animate-fade-in-up animate-stagger-5">
              {benefits.map((item, index) => (
                <div 
                  key={index} 
                  className={`flex items-center justify-center gap-3 p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl modern-card animate-fade-in-up animate-stagger-${index + 1}`}
                >
                  <item.icon className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300 font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-4 relative bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white animate-fade-in-up">
              Tudo que você precisa para
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-fade-in-up animate-stagger-1"> vender mais</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto animate-fade-in-up animate-stagger-2">
              Ferramentas profissionais de copywriting ao alcance de todos
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <ModernCard 
                key={index} 
                variant="glass" 
                interactive 
                className={`group p-8 hover:shadow-2xl modern-card bg-white/5 border-white/10 animate-fade-in-up animate-stagger-${index + 1}`}
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-white group-hover:text-blue-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </ModernCard>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-32 px-4 relative bg-gray-900">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 to-black/50 animate-fade-in" />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-20 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Como Funciona
            </h2>
            <p className="text-xl text-gray-300 animate-fade-in-up animate-stagger-1">
              Três passos simples para copies que convertem
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {howItWorksSteps.map((item, index) => (
              <div key={index} className={`text-center group animate-fade-in-up animate-stagger-${index + 1}`}>
                <div className={`w-20 h-20 bg-gradient-to-r ${item.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  <span className="text-white font-bold text-2xl">{item.step}</span>
                </div>
                <h3 className="font-bold text-xl mb-4 text-white group-hover:text-blue-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 px-4 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              O que nossos usuários dizem
            </h2>
            <p className="text-xl text-gray-300 animate-fade-in-up animate-stagger-1">
              Resultados reais de quem já transformou suas vendas
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <ModernCard 
                key={index} 
                variant="glass" 
                interactive 
                className={`p-8 group modern-card bg-white/5 border-white/10 animate-fade-in-up animate-stagger-${index + 1}`}
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <blockquote className="text-white mb-6 italic text-lg leading-relaxed">
                  "{testimonial.content}"
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-sm text-gray-300">{testimonial.role}</p>
                  </div>
                </div>
              </ModernCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Floating shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float animate-stagger-3" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center animate-fade-in-up">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight animate-fade-in-up">
            Pronto para Transformar suas Vendas?
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animate-stagger-1">
            Comece agora mesmo e veja como é fácil criar copies que convertem. 
            <span className="font-semibold"> Milhares de empresas já confiam em nós.</span>
          </p>
          
          <ModernButton 
            size="lg" 
            variant="glass" 
            className="text-lg px-10 py-4 group modern-button bg-white/20 text-white border-white/30 hover:bg-white/30 animate-fade-in-up animate-stagger-2" 
            asChild
          >
            <Link to="/quiz" className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Começar Meu Quiz Gratuito
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </ModernButton>
        </div>
      </section>
    </div>
  );
};

export default Index;
