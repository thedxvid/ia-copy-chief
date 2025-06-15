
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CreditCard, CheckCircle, XCircle, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { FadeInSection } from '@/components/ui/fade-in-section';

export const SubscriptionStatus: React.FC = () => {
  const { subscription, loading, isSubscriptionActive, isSubscriptionExpired } = useSubscription();
  const navigate = useNavigate();

  // Redirecionar automaticamente para dashboard se subscription estiver ativa
  useEffect(() => {
    if (isSubscriptionActive && !loading) {
      console.log('Subscription active, redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    }
  }, [isSubscriptionActive, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#121212] via-[#1A1A1A] to-[#121212] bg-[length:400%_400%] animate-[gradientShift_15s_ease_infinite] flex items-center justify-center">
        <Card className="bg-white/95 backdrop-blur-md border-none shadow-2xl max-w-lg w-full mx-4">
          <CardContent className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 via-red-600 to-red-500 bg-[length:400%_400%] animate-[gradientShift_15s_ease_infinite] flex items-center justify-center">
        <Card className="bg-white/95 backdrop-blur-md border-none shadow-2xl max-w-lg w-full mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-gray-800 flex items-center justify-center gap-2">
              <XCircle className="w-6 h-6 text-red-500" />
              Erro ao carregar subscription
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const getStatusInfo = () => {
    switch (subscription.subscription_status) {
      case 'pending':
        return {
          icon: <Clock className="w-12 h-12 text-amber-500" />,
          title: 'Finalize sua Assinatura',
          description: 'Sua conta foi criada com sucesso! Clique no botão abaixo para fazer o pagamento e desbloquear o acesso completo à plataforma.',
          color: 'amber',
          buttonText: 'Finalizar Pagamento',
          buttonAction: () => window.open('https://pay.kiwify.com.br/nzX4lAh', '_blank'),
          showCheckingStatus: true,
        };
      case 'active':
        if (isSubscriptionExpired) {
          return {
            icon: <AlertTriangle className="w-12 h-12 text-orange-500" />,
            title: 'Subscription Expirada',
            description: 'Seu acesso expirou. Renove sua subscription para continuar usando a plataforma.',
            color: 'orange',
            buttonText: 'Renovar Acesso',
            buttonAction: () => window.open('https://pay.kiwify.com.br/nzX4lAh', '_blank'),
            showCheckingStatus: false,
          };
        }
        return {
          icon: <CheckCircle className="w-12 h-12 text-green-500" />,
          title: '🎉 Pagamento Confirmado!',
          description: 'Parabéns! Seu pagamento foi processado com sucesso. Você será redirecionado para o dashboard em instantes.',
          color: 'green',
          buttonText: 'Ir para Dashboard',
          buttonAction: () => navigate('/dashboard'),
          showCheckingStatus: false,
        };
      case 'expired':
        return {
          icon: <XCircle className="w-12 h-12 text-red-500" />,
          title: 'Acesso Expirado',
          description: 'Sua subscription expirou. Renove para continuar usando a plataforma.',
          color: 'red',
          buttonText: 'Renovar Acesso',
          buttonAction: () => window.open('https://pay.kiwify.com.br/nzX4lAh', '_blank'),
          showCheckingStatus: false,
        };
      case 'cancelled':
        return {
          icon: <XCircle className="w-12 h-12 text-red-500" />,
          title: 'Subscription Cancelada',
          description: 'Sua subscription foi cancelada. Entre em contato conosco se precisar de ajuda.',
          color: 'red',
          buttonText: 'Entrar em Contato',
          buttonAction: () => window.open('mailto:suporte@copymaster.app', '_blank'),
          showCheckingStatus: false,
        };
      default:
        return {
          icon: <AlertTriangle className="w-12 h-12 text-gray-500" />,
          title: 'Status Desconhecido',
          description: 'Entre em contato com o suporte.',
          color: 'gray',
          buttonText: 'Contatar Suporte',
          buttonAction: () => window.open('mailto:suporte@copymaster.app', '_blank'),
          showCheckingStatus: false,
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#121212] via-[#1A1A1A] to-[#121212] bg-[length:400%_400%] animate-[gradientShift_15s_ease_infinite] flex items-center justify-center px-4">
      <FadeInSection>
        <Card className="bg-white/95 backdrop-blur-md border-none shadow-2xl max-w-lg w-full animate-[slideUp_0.8s_ease-out]">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center animate-[pulse_2s_infinite] shadow-lg">
                {statusInfo.icon}
              </div>
            </div>
            <CardTitle className="text-gray-800 text-3xl font-bold mb-3">
              {statusInfo.title}
            </CardTitle>
            <p className="text-gray-600 text-lg leading-relaxed">
              {statusInfo.description}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {subscription.subscription_status === 'pending' && (
              <div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <p className="text-amber-800 font-semibold text-sm">Oferta Especial</p>
                </div>
                <p className="text-amber-700 text-sm">
                  Apenas <strong>R$ 97/mês</strong> (valor normal R$ 1.132). 
                  Esta promoção é válida apenas para novos usuários.
                </p>
              </div>
            )}

            {subscription.subscription_status === 'active' && !isSubscriptionExpired && (
              <div className="bg-green-50 border-l-4 border-green-400 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <p className="text-green-800 font-semibold text-sm">Acesso Liberado</p>
                </div>
                <p className="text-green-700 text-sm">
                  Seu acesso está ativo até {subscription.subscription_expires_at ? new Date(subscription.subscription_expires_at).toLocaleDateString('pt-BR') : 'indefinido'}.
                </p>
              </div>
            )}

            {statusInfo.showCheckingStatus && (
              <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-600 animate-spin" />
                  <p className="text-blue-800 font-semibold text-sm">Verificando Status</p>
                </div>
                <p className="text-blue-700 text-sm">
                  Aguardando confirmação do pagamento. Esta página será atualizada automaticamente.
                </p>
              </div>
            )}

            <div className="text-center space-y-4">
              <Button
                onClick={statusInfo.buttonAction}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg"
              >
                <div className="flex items-center justify-center gap-3">
                  <CreditCard className="w-5 h-5" />
                  {statusInfo.buttonText}
                  <ArrowRight className="w-5 h-5" />
                </div>
              </Button>
              
              {subscription.subscription_status === 'pending' && (
                <p className="text-gray-500 text-sm">
                  Após o pagamento, você será redirecionado automaticamente
                </p>
              )}
            </div>

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-gray-500 text-sm">
                Precisa de ajuda?{' '}
                <a 
                  href="mailto:suporte@copymaster.app" 
                  className="text-blue-600 hover:underline font-medium"
                >
                  Entre em contato
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </FadeInSection>

      <style>{`
        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
