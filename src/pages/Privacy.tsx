
import React from 'react';
import { Header } from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { FadeInSection } from '@/components/ui/fade-in-section';
import { ModernCard } from '@/components/ui/modern-card';
import { Shield } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-[#121212] font-inter">
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center mb-16">
              <div className="w-16 h-16 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-white">
                Política de
                <span className="bg-gradient-to-r from-[#3B82F6] to-[#2563EB] bg-clip-text text-transparent"> Privacidade</span>
              </h1>
              <p className="text-xl text-[#CCCCCC] max-w-3xl mx-auto">
                Última atualização: {new Date().toLocaleDateString('pt-BR')}
              </p>
            </div>
          </FadeInSection>

          <FadeInSection delay={100}>
            <ModernCard className="p-8 bg-[#1E1E1E] border border-[#4B5563]/30 space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">1. Informações que Coletamos</h2>
                <div className="space-y-4 text-[#CCCCCC]">
                  <p>Coletamos as seguintes informações quando você usa nossa plataforma:</p>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-white mb-2">Informações Pessoais:</h3>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Nome completo e endereço de email</li>
                      <li>Informações de pagamento (processadas por terceiros seguros)</li>
                      <li>Dados de comunicação e suporte</li>
                    </ul>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-white mb-2">Informações de Uso:</h3>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Conteúdo criado e prompts utilizados</li>
                      <li>Dados de navegação e interação com a plataforma</li>
                      <li>Informações técnicas do dispositivo e navegador</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">2. Como Usamos suas Informações</h2>
                <div className="space-y-4 text-[#CCCCCC]">
                  <p>Utilizamos suas informações para:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Fornecer e melhorar nossos serviços de IA</li>
                    <li>Processar pagamentos e gerenciar sua conta</li>
                    <li>Personalizar sua experiência na plataforma</li>
                    <li>Enviar atualizações importantes sobre o serviço</li>
                    <li>Treinar e aprimorar nossos modelos de IA (dados anonimizados)</li>
                    <li>Prevenir fraudes e garantir a segurança da plataforma</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">3. Compartilhamento de Informações</h2>
                <div className="space-y-4 text-[#CCCCCC]">
                  <p>Não vendemos suas informações pessoais. Podemos compartilhar dados apenas:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Com prestadores de serviços terceirizados (pagamento, hospedagem)</li>
                    <li>Quando exigido por lei ou processo legal</li>
                    <li>Para proteger nossos direitos legais</li>
                    <li>Com seu consentimento explícito</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">4. Proteção de Dados</h2>
                <div className="space-y-4 text-[#CCCCCC]">
                  <p>Implementamos medidas de segurança robustas:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Criptografia SSL/TLS para todas as comunicações</li>
                    <li>Criptografia de dados em repouso</li>
                    <li>Controles de acesso rigorosos</li>
                    <li>Monitoramento contínuo de segurança</li>
                    <li>Backups seguros e regulares</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">5. Cookies e Tecnologias Similares</h2>
                <p className="text-[#CCCCCC] leading-relaxed">
                  Utilizamos cookies essenciais para o funcionamento da plataforma, cookies de analytics para 
                  entender como você usa nossos serviços, e cookies de preferências para personalizar sua experiência. 
                  Você pode gerenciar suas preferências de cookies nas configurações do seu navegador.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">6. Seus Direitos</h2>
                <div className="space-y-4 text-[#CCCCCC]">
                  <p>De acordo com a LGPD, você tem direito a:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Acessar seus dados pessoais</li>
                    <li>Corrigir dados incompletos ou inexatos</li>
                    <li>Solicitar a exclusão de dados desnecessários</li>
                    <li>Revogar seu consentimento</li>
                    <li>Solicitar a portabilidade de dados</li>
                    <li>Obter informações sobre o uso de seus dados</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">7. Retenção de Dados</h2>
                <p className="text-[#CCCCCC] leading-relaxed">
                  Mantemos seus dados pessoais apenas pelo tempo necessário para cumprir as finalidades para as 
                  quais foram coletados, atender a obrigações legais ou resolver disputas. Dados de conteúdo 
                  podem ser mantidos de forma anonimizada para melhorar nossos algoritmos.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">8. Transferências Internacionais</h2>
                <p className="text-[#CCCCCC] leading-relaxed">
                  Alguns de nossos prestadores de serviços podem estar localizados fora do Brasil. Nesses casos, 
                  garantimos que adequadas medidas de proteção estejam em vigor, incluindo cláusulas contratuais 
                  padrão e certificações de privacidade.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">9. Menores de Idade</h2>
                <p className="text-[#CCCCCC] leading-relaxed">
                  Nossos serviços não são direcionados a menores de 18 anos. Não coletamos conscientemente 
                  informações pessoais de menores. Se tomarmos conhecimento de que coletamos dados de um menor, 
                  tomaremos medidas para excluir essas informações.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">10. Alterações nesta Política</h2>
                <p className="text-[#CCCCCC] leading-relaxed">
                  Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas 
                  através do email cadastrado ou através de avisos na plataforma. Recomendamos revisar esta 
                  política regularmente.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">11. Contato</h2>
                <div className="text-[#CCCCCC] space-y-2">
                  <p>Para questões sobre privacidade ou para exercer seus direitos, entre em contato:</p>
                  <p><strong>Email:</strong> <span className="text-[#3B82F6]">privacidade@copychief.com.br</span></p>
                  <p><strong>DPO (Encarregado de Dados):</strong> <span className="text-[#3B82F6]">dpo@copychief.com.br</span></p>
                </div>
              </div>
            </ModernCard>
          </FadeInSection>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
