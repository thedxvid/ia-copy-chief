
import React from 'react';
import { Target, Sparkles, Zap, Brain, Users, Trophy } from 'lucide-react';
import { ModernCard } from '@/components/ui/modern-card';

export function FeaturesSection() {
  const features = [
    {
      icon: Brain,
      title: 'IA Estratégica Avançada',
      description: 'Sistema treinado com +50.000 campanhas de sucesso e gatilhos mentais comprovados',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Target,
      title: 'Quiz Inteligente de Negócio',
      description: 'Análise profunda do seu produto, público e mercado para copies ultra-personalizadas',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Sparkles,
      title: 'Copy de Anúncios Automática',
      description: 'Geração instantânea de headlines, descrições e CTAs que convertem',
      gradient: 'from-pink-500 to-rose-500'
    },
    {
      icon: Zap,
      title: 'Roteiros de Vídeo VSL',
      description: 'Scripts persuasivos para Video Sales Letters com estruturas testadas',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: Users,
      title: 'Segmentação de Público',
      description: 'Identificação automática de personas e criação de mensagens direcionadas',
      gradient: 'from-teal-500 to-green-500'
    },
    {
      icon: Trophy,
      title: 'Templates Premium',
      description: 'Biblioteca com +100 modelos de alta conversão para diferentes nichos',
      gradient: 'from-indigo-500 to-purple-500'
    }
  ];

  return (
    <section className="py-32 px-4 relative bg-gray-800/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24 animate-fade-in-up">
          <h2 className="text-5xl md:text-6xl font-bold mb-8 text-white animate-fade-in-up">
            Tecnologia que
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-fade-in-up animate-stagger-1"> Revoluciona Vendas</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto animate-fade-in-up animate-stagger-2">
            Ferramentas profissionais de copywriting com inteligência artificial avançada
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
              <div className="flex flex-col items-start space-y-4">
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-3 text-white group-hover:text-blue-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed text-base">
                    {feature.description}
                  </p>
                </div>
              </div>
            </ModernCard>
          ))}
        </div>
      </div>
    </section>
  );
}
