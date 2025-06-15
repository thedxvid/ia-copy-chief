
import React from 'react';
import { Header } from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { FadeInSection } from '@/components/ui/fade-in-section';
import { ModernCard } from '@/components/ui/modern-card';
import { ScrollText } from 'lucide-react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-[#121212] font-inter">
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center mb-16">
              <div className="w-16 h-16 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ScrollText className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-white">
                Termos de
                <span className="bg-gradient-to-r from-[#3B82F6] to-[#2563EB] bg-clip-text text-transparent"> Serviço</span>
              </h1>
              <p className="text-xl text-[#CCCCCC] max-w-3xl mx-auto">
                Última atualização: {new Date().toLocaleDateString('pt-BR')}
              </p>
            </div>
          </FadeInSection>

          <FadeInSection delay={100}>
            <ModernCard className="p-8 bg-[#1E1E1E] border border-[#4B5563]/30 space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">1. Aceitação dos Termos</h2>
                <p className="text-[#CCCCCC] leading-relaxed">
                  Ao acessar e usar a plataforma CopyChief, você concorda em cumprir e estar vinculado a estes 
                  Termos de Serviço. Se você não concordar com qualquer parte destes termos, não deve usar nossos serviços.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">2. Descrição do Serviço</h2>
                <p className="text-[#CCCCCC] leading-relaxed mb-4">
                  A CopyChief é uma plataforma de inteligência artificial especializada em copywriting que oferece:
                </p>
                <ul className="list-disc list-inside text-[#CCCCCC] space-y-2 ml-4">
                  <li>Geração automática de textos publicitários</li>
                  <li>Scripts para vídeos de vendas (VSL)</li>
                  <li>Análise e otimização de campanhas</li>
                  <li>Modelos e templates personalizáveis</li>
                  <li>Ferramentas de análise de público-alvo</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">3. Conta de Usuário</h2>
                <div className="space-y-4 text-[#CCCCCC]">
                  <p>Para usar nossos serviços, você deve:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Fornecer informações precisas e completas durante o registro</li>
                    <li>Manter a segurança de suas credenciais de acesso</li>
                    <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
                    <li>Ser responsável por todas as atividades em sua conta</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">4. Planos e Pagamentos</h2>
                <div className="space-y-4 text-[#CCCCCC]">
                  <p>Nossa plataforma oferece diferentes planos de assinatura:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Os pagamentos são processados mensalmente ou anualmente</li>
                    <li>As cobranças são feitas automaticamente</li>
                    <li>Você pode cancelar sua assinatura a qualquer momento</li>
                    <li>Não oferecemos reembolsos para períodos já utilizados</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">5. Uso Aceitável</h2>
                <div className="space-y-4 text-[#CCCCCC]">
                  <p>Você concorda em não usar nossos serviços para:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Criar conteúdo ilegal, ofensivo ou prejudicial</li>
                    <li>Violar direitos de propriedade intelectual de terceiros</li>
                    <li>Distribuir spam ou conteúdo não solicitado</li>
                    <li>Tentar quebrar ou contornar medidas de segurança</li>
                    <li>Revender ou redistribuir nossos serviços sem autorização</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">6. Propriedade Intelectual</h2>
                <p className="text-[#CCCCCC] leading-relaxed">
                  O conteúdo gerado pela nossa IA pertence a você, mas você concede à CopyChief uma licença 
                  para usar esses dados de forma anônima para melhorar nossos serviços. Todos os direitos sobre 
                  a plataforma, algoritmos e tecnologia permanecem com a CopyChief.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">7. Limitação de Responsabilidade</h2>
                <p className="text-[#CCCCCC] leading-relaxed">
                  A CopyChief não se responsabiliza por danos diretos, indiretos, incidentais ou consequenciais 
                  resultantes do uso de nossos serviços. Fornecemos a plataforma "como está" e não garantimos 
                  resultados específicos de vendas ou marketing.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">8. Modificações dos Termos</h2>
                <p className="text-[#CCCCCC] leading-relaxed">
                  Reservamos o direito de modificar estes termos a qualquer momento. As alterações entrarão em 
                  vigor imediatamente após a publicação. O uso continuado de nossos serviços constitui aceitação 
                  dos termos modificados.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">9. Rescisão</h2>
                <p className="text-[#CCCCCC] leading-relaxed">
                  Podemos suspender ou encerrar sua conta por violação destes termos. Você pode cancelar sua 
                  conta a qualquer momento através das configurações da plataforma ou entrando em contato conosco.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">10. Contato</h2>
                <p className="text-[#CCCCCC] leading-relaxed">
                  Para dúvidas sobre estes Termos de Serviço, entre em contato conosco através do email: 
                  <span className="text-[#3B82F6]"> legal@copychief.com.br</span>
                </p>
              </div>
            </ModernCard>
          </FadeInSection>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
