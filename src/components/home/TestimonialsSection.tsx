
import React from 'react';
import { Star, TrendingUp, DollarSign, Users } from 'lucide-react';
import { ModernCard } from '@/components/ui/modern-card';

export function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Maria Silva',
      role: 'CEO E-commerce Fashion',
      content: 'Minhas vendas aumentaram 347% em 30 dias usando as copies do CopyChief. A IA entende exatamente o que meu público quer ouvir!',
      rating: 5,
      avatar: '👩‍💼',
      metric: '+347% vendas',
      company: 'ModaStyle'
    },
    {
      name: 'João Santos',
      role: 'Infoprodutor Digital',
      content: 'Nunca pensei que seria tão fácil criar copies que convertem. O quiz estratégico me ajudou a entender melhor meu próprio negócio.',
      rating: 5,
      avatar: '👨‍💻',
      metric: '+892 leads',
      company: 'EduTech Pro'
    },
    {
      name: 'Ana Costa',
      role: 'Diretora de Marketing',
      content: 'Nossa agência economiza 15 horas por semana criando copies. Os clientes ficam impressionados com a qualidade e velocidade.',
      rating: 5,
      avatar: '👩‍🚀',
      metric: '15h economizadas',
      company: 'Growth Agency'
    }
  ];

  const stats = [
    { icon: Users, value: '10.000+', label: 'Empresas Atendidas' },
    { icon: TrendingUp, value: '250%', label: 'Aumento Médio em Conversões' },
    { icon: DollarSign, value: 'R$ 50M+', label: 'Em Vendas Geradas' },
    { icon: Star, value: '4.9/5', label: 'Avaliação dos Usuários' }
  ];

  return (
    <section className="py-32 px-4 bg-gray-800/50">
      <div className="max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div key={index} className={`text-center animate-fade-in-up animate-stagger-${index + 1}`}>
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-gray-300 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="text-center mb-20 animate-fade-in-up">
          <h2 className="text-5xl md:text-6xl font-bold mb-8 text-white">
            Resultados Comprovados
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 animate-fade-in-up animate-stagger-1">
            Histórias reais de quem transformou suas vendas com CopyChief
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
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-sm text-gray-300">{testimonial.role}</p>
                    <p className="text-xs text-blue-400">{testimonial.company}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-green-400 font-bold text-lg">{testimonial.metric}</div>
                </div>
              </div>
            </ModernCard>
          ))}
        </div>
      </div>
    </section>
  );
}
