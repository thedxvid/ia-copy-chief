
import React from 'react';
import { Check, Clock, Users, Award, Zap, Target, TrendingUp, Shield } from 'lucide-react';
import { ModernCard } from '@/components/ui/modern-card';
import { ModernButton } from '@/components/ui/modern-button';
import { Badge } from '@/components/ui/badge';

export function OfferSection() {
  const benefits = [
    {
      icon: Zap,
      title: 'Agentes IA Especializados',
      description: 'Copy, Headlines, Scripts e VSL personalizados',
      value: 'R$ 297/mês'
    },
    {
      icon: Target,
      title: 'Geração de Ofertas Automáticas',
      description: 'Ofertas irresistíveis criadas em segundos',
      value: 'R$ 197/mês'
    },
    {
      icon: TrendingUp,
      title: 'Biblioteca de Copys Vencedoras',
      description: '+1.000 copys testidas e aprovadas',
      value: 'R$ 147/mês'
    },
    {
      icon: Award,
      title: 'Modelos Prontos Premium',
      description: 'Landing pages, VSLs e ordem de vendas',
      value: 'R$ 197/mês'
    },
    {
      icon: Clock,
      title: 'Atualizações Semanais',
      description: 'Novas estratégias toda semana',
      value: 'R$ 97/mês'
    },
    {
      icon: Shield,
      title: 'Suporte Prioritário VIP',
      description: 'Atendimento exclusivo e roadmap privado',
      value: 'R$ 197/mês'
    }
  ];

  const totalValue = benefits.reduce((sum, benefit) => {
    return sum + parseInt(benefit.value.replace('R$ ', '').replace('/mês', ''));
  }, 0);

  return (
    <section className="relative py-16 sm:py-24 px-3 sm:px-4 bg-gradient-to-b from-[#121212] via-[#1A1A1A] to-[#121212] overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-gradient-to-r from-[#3B82F6]/10 to-[#2563EB]/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-56 sm:w-80 h-56 sm:h-80 bg-gradient-to-l from-[#2563EB]/10 to-[#3B82F6]/5 rounded-full blur-3xl animate-float animate-stagger-3" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 animate-fade-in-up">
          <div className="flex justify-center mb-4 sm:mb-6">
            <Badge className="bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold rounded-full">
              <Clock className="w-3 sm:w-4 h-3 sm:h-4 mr-2" />
              OFERTA POR TEMPO LIMITADO
            </Badge>
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight px-2">
            Pare de Perder Vendas por
            <span className="bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1E40AF] bg-clip-text text-transparent block mt-2">
              Copy Medíocre
            </span>
          </h2>
          
          <p className="text-lg sm:text-xl md:text-2xl text-[#CCCCCC] max-w-4xl mx-auto leading-relaxed px-2">
            Transforme suas vendas com IA que domina copywriting como os grandes nomes do mercado. 
            <span className="text-[#3B82F6] font-semibold block mt-2">
              Desenvolvido com as estratégias dos melhores copywriters do Brasil.
            </span>
          </p>
        </div>

        {/* Main Offer Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-start">
          {/* Benefits Side - agora será a primeira na ordem mobile */}
          <div className="space-y-6 sm:space-y-8 animate-fade-in-up animate-stagger-2 order-1">
            <div className="mb-6 sm:mb-8">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4">
                O que você recebe hoje:
              </h3>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <Badge className="bg-green-500/20 text-green-400 border border-green-400/30 text-xs sm:text-sm">
                  <Users className="w-3 sm:w-4 h-3 sm:h-4 mr-2" />
                  +5.247 usuários ativos
                </Badge>
                <Badge className="bg-orange-500/20 text-orange-400 border border-orange-400/30 text-xs sm:text-sm">
                  <Award className="w-3 sm:w-4 h-3 sm:h-4 mr-2" />
                  Últimas 47 vagas
                </Badge>
              </div>
            </div>

            <div className="grid gap-4 sm:gap-6">
              {benefits.map((benefit, index) => (
                <ModernCard 
                  key={index}
                  className={`p-4 sm:p-6 bg-[#1E1E1E]/80 border border-[#4B5563]/30 hover:border-[#3B82F6]/50 transition-all duration-300 animate-fade-in-up animate-stagger-${index + 1}`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex-shrink-0 w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-full flex items-center justify-center">
                      <benefit.icon className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-1 sm:gap-0">
                        <h4 className="text-base sm:text-lg font-semibold text-white">{benefit.title}</h4>
                        <span className="text-xs sm:text-sm text-[#3B82F6] font-medium line-through opacity-60 self-start sm:self-auto">
                          {benefit.value}
                        </span>
                      </div>
                      <p className="text-sm sm:text-base text-[#CCCCCC]">{benefit.description}</p>
                    </div>
                    <Check className="w-4 sm:w-5 h-4 sm:h-5 text-green-400 flex-shrink-0 mt-1" />
                  </div>
                </ModernCard>
              ))}
            </div>
          </div>

          {/* Pricing Side - agora será a segunda na ordem mobile */}
          <div className="animate-fade-in-up animate-stagger-3 order-2">
            <ModernCard className="p-6 sm:p-8 bg-gradient-to-b from-[#1E1E1E] to-[#2A2A2A] border-2 border-[#3B82F6]/50 relative overflow-hidden">
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full animate-[shimmer_3s_infinite]" />
              
              <div className="relative z-10">
                {/* Value Anchor */}
                <div className="text-center mb-6 sm:mb-8">
                  <p className="text-[#CCCCCC] mb-2 text-sm sm:text-base">Valor real de tudo isso:</p>
                  <div className="text-2xl sm:text-3xl font-bold text-[#CCCCCC] line-through opacity-60 mb-2">
                    R$ {totalValue.toLocaleString('pt-BR')}/mês
                  </div>
                  <p className="text-xs sm:text-sm text-red-400 font-medium">Economia de {Math.round(((totalValue - 97) / totalValue) * 100)}%</p>
                </div>

                {/* Main Price */}
                <div className="text-center mb-6 sm:mb-8">
                  <p className="text-base sm:text-lg text-[#CCCCCC] mb-2">Seu investimento hoje:</p>
                  <div className="text-5xl sm:text-6xl md:text-7xl font-bold bg-gradient-to-r from-[#3B82F6] to-[#2563EB] bg-clip-text text-transparent mb-2">
                    R$ 97
                  </div>
                  <p className="text-lg sm:text-xl text-[#CCCCCC]">/mês</p>
                </div>

                {/* CTA Button */}
                <ModernButton 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white text-lg sm:text-xl font-bold py-4 sm:py-6 rounded-full hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-[#3B82F6]/30 mb-4 sm:mb-6"
                >
                  <Zap className="w-5 sm:w-6 h-5 sm:h-6 mr-3" />
                  Quero Desbloquear Agora
                </ModernButton>

                {/* Guarantees */}
                <div className="space-y-2 sm:space-y-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-[#CCCCCC]">
                    <Shield className="w-3 sm:w-4 h-3 sm:h-4 text-green-400 flex-shrink-0" />
                    <span>Cancele quando quiser, sem burocracia</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-[#CCCCCC]">
                    <Check className="w-3 sm:w-4 h-3 sm:h-4 text-green-400 flex-shrink-0" />
                    <span>Acesso imediato após confirmação</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-[#CCCCCC]">
                    <Clock className="w-3 sm:w-4 h-3 sm:h-4 text-orange-400 flex-shrink-0" />
                    <span>Oferta válida por mais 2 dias</span>
                  </div>
                </div>
              </div>
            </ModernCard>

            {/* Social Proof */}
            <div className="mt-6 sm:mt-8 text-center">
              <p className="text-xs sm:text-sm text-[#CCCCCC] mb-3 sm:mb-4">Junte-se a milhares de empreendedores que já transformaram suas vendas:</p>
              <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
                <Badge className="bg-[#1E1E1E] text-[#CCCCCC] border border-[#4B5563] text-xs">
                  <TrendingUp className="w-3 h-3 mr-2" />
                  +340% em conversões
                </Badge>
                <Badge className="bg-[#1E1E1E] text-[#CCCCCC] border border-[#4B5563] text-xs">
                  <Clock className="w-3 h-3 mr-2" />
                  Economia de 40h/semana
                </Badge>
                <Badge className="bg-[#1E1E1E] text-[#CCCCCC] border border-[#4B5563] text-xs">
                  <Award className="w-3 h-3 mr-2" />
                  ROI médio de 890%
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
