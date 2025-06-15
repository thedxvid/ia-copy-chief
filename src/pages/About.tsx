
import React from 'react';
import { Header } from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { FadeInSection } from '@/components/ui/fade-in-section';
import { ModernCard } from '@/components/ui/modern-card';
import { Bot, Target, Users, Award } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-[#121212] font-inter">
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center mb-16">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-white">
                Sobre a
                <span className="bg-gradient-to-r from-[#3B82F6] to-[#2563EB] bg-clip-text text-transparent"> CopyChief</span>
              </h1>
              <p className="text-xl text-[#CCCCCC] max-w-3xl mx-auto">
                Revolucionando o copywriting com inteligência artificial avançada para transformar suas vendas
              </p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
            <FadeInSection delay={100}>
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-white mb-6">Nossa Missão</h2>
                <p className="text-lg text-[#CCCCCC] leading-relaxed">
                  Democratizar o acesso ao copywriting de alta conversão através da inteligência artificial, 
                  permitindo que empreendedores e empresas de todos os tamanhos criem conteúdos persuasivos 
                  que realmente vendem.
                </p>
                <p className="text-lg text-[#CCCCCC] leading-relaxed">
                  Nossa plataforma foi desenvolvida com base em milhares de campanhas de sucesso e incorpora 
                  as melhores práticas dos copywriters mais renomados do Brasil.
                </p>
              </div>
            </FadeInSection>

            <FadeInSection delay={200}>
              <ModernCard className="p-8 bg-[#1E1E1E] border border-[#4B5563]/30">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-2xl flex items-center justify-center">
                    <Bot className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">CopyChief IA</h3>
                    <p className="text-[#CCCCCC]">Tecnologia de ponta</p>
                  </div>
                </div>
                <p className="text-[#CCCCCC] leading-relaxed">
                  Nossa IA foi treinada com mais de 50.000 campanhas de marketing digital, 
                  scripts de vendas de alta conversão e estratégias comprovadas do mercado brasileiro.
                </p>
              </ModernCard>
            </FadeInSection>
          </div>

          <FadeInSection delay={300}>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Nossos Valores</h2>
              <p className="text-xl text-[#CCCCCC]">O que nos guia em nossa jornada</p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Target,
                title: 'Resultados',
                description: 'Focamos em entregas que realmente impactem suas vendas'
              },
              {
                icon: Users,
                title: 'Acessibilidade',
                description: 'Copywriting profissional ao alcance de todos'
              },
              {
                icon: Award,
                title: 'Qualidade',
                description: 'Padrão premium em todas as nossas soluções'
              },
              {
                icon: Bot,
                title: 'Inovação',
                description: 'Sempre na vanguarda da tecnologia'
              }
            ].map((value, index) => (
              <FadeInSection key={index} delay={400 + index * 100}>
                <ModernCard className="p-6 bg-[#1E1E1E] border border-[#4B5563]/30 text-center hover:border-[#3B82F6]/50 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-xl flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{value.title}</h3>
                  <p className="text-[#CCCCCC]">{value.description}</p>
                </ModernCard>
              </FadeInSection>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
