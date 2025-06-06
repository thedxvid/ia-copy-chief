
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Star, Sparkles, Zap, Target } from 'lucide-react';
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

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 safe-top">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background" />
        
        {/* Floating elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute top-40 right-20 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="animate-slide-up">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              Gere Copies de Vendas
              <span className="text-gradient-warm block mt-2">Profissionais em Minutos</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Transforme suas ideias em copies persuasivas com nosso sistema inteligente 
              baseado em questionário estratégico. <span className="text-primary font-semibold">Sem complicação, só resultados.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <ModernButton asChild size="lg" variant="gradient" className="group">
                <Link to="/quiz">
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Começar Agora
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </ModernButton>
              
              <ModernButton variant="glass" size="lg" asChild>
                <Link to="/dashboard">
                  Ver Dashboard
                </Link>
              </ModernButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              {[
                { icon: Check, text: 'Grátis para sempre' },
                { icon: Check, text: 'Sem cadastro necessário' },
                { icon: Check, text: 'Resultados instantâneos' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-center gap-3 p-4 glass rounded-xl">
                  <item.icon className="w-5 h-5 text-green-500" />
                  <span className="text-muted-foreground font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Tudo que você precisa para
              <span className="text-gradient"> vender mais</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ferramentas profissionais de copywriting ao alcance de todos
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <ModernCard 
                key={index} 
                variant="glass" 
                interactive 
                className="group p-8 hover:shadow-2xl"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-foreground group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
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
      <section className="py-32 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-background" />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Como Funciona
            </h2>
            <p className="text-xl text-muted-foreground">
              Três passos simples para copies que convertem
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {[
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
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div className={`w-20 h-20 bg-gradient-to-r ${item.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  <span className="text-white font-bold text-2xl">{item.step}</span>
                </div>
                <h3 className="font-bold text-xl mb-4 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              O que nossos usuários dizem
            </h2>
            <p className="text-xl text-muted-foreground">
              Resultados reais de quem já transformou suas vendas
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <ModernCard key={index} variant="glass" interactive className="p-8 group">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <blockquote className="text-foreground mb-6 italic text-lg leading-relaxed">
                  "{testimonial.content}"
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary to-purple-600 rounded-full flex items-center justify-center text-xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </ModernCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary" />
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Floating shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
            Pronto para Transformar suas Vendas?
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
            Comece agora mesmo e veja como é fácil criar copies que convertem. 
            <span className="font-semibold"> Milhares de empresas já confiam em nós.</span>
          </p>
          
          <ModernButton size="lg" variant="glass" className="text-lg px-10 py-4 group" asChild>
            <Link to="/quiz">
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
