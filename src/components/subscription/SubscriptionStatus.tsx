
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CreditCard, CheckCircle, XCircle, AlertTriangle, Mail } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';

export const SubscriptionStatus: React.FC = () => {
  const { subscription, loading, isSubscriptionActive, isSubscriptionExpired } = useSubscription();

  if (loading) {
    return (
      <Card className="bg-[#1E1E1E] border-[#4B5563] max-w-md mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B82F6]"></div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card className="bg-[#1E1E1E] border-[#4B5563] max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-white flex items-center justify-center gap-2">
            <XCircle className="w-6 h-6 text-red-500" />
            Erro ao carregar subscription
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const getStatusInfo = () => {
    switch (subscription.subscription_status) {
      case 'pending':
        return {
          icon: <Clock className="w-8 h-8 text-yellow-500" />,
          title: 'Aguardando Pagamento',
          description: 'Sua conta foi criada com sucesso! Agora você precisa fazer o pagamento para acessar a plataforma.',
          color: 'yellow',
          action: subscription.checkout_url ? 'Fazer Pagamento' : 'Aguardando Link',
          showEmailInfo: true,
        };
      case 'active':
        if (isSubscriptionExpired) {
          return {
            icon: <AlertTriangle className="w-8 h-8 text-orange-500" />,
            title: 'Subscription Expirada',
            description: 'Seu acesso expirou. Renove sua subscription para continuar usando a plataforma.',
            color: 'orange',
            action: 'Renovar Acesso',
            showEmailInfo: false,
          };
        }
        return {
          icon: <CheckCircle className="w-8 h-8 text-green-500" />,
          title: 'Acesso Ativo',
          description: `Sua subscription está ativa até ${subscription.subscription_expires_at ? new Date(subscription.subscription_expires_at).toLocaleDateString('pt-BR') : 'indefinido'}.`,
          color: 'green',
          action: null,
          showEmailInfo: false,
        };
      case 'expired':
        return {
          icon: <XCircle className="w-8 h-8 text-red-500" />,
          title: 'Acesso Expirado',
          description: 'Sua subscription expirou. Renove para continuar usando a plataforma.',
          color: 'red',
          action: 'Renovar Acesso',
          showEmailInfo: false,
        };
      case 'cancelled':
        return {
          icon: <XCircle className="w-8 h-8 text-red-500" />,
          title: 'Subscription Cancelada',
          description: 'Sua subscription foi cancelada. Entre em contato conosco se precisar de ajuda.',
          color: 'red',
          action: 'Entrar em Contato',
          showEmailInfo: false,
        };
      default:
        return {
          icon: <AlertTriangle className="w-8 h-8 text-gray-500" />,
          title: 'Status Desconhecido',
          description: 'Entre em contato com o suporte.',
          color: 'gray',
          action: 'Contatar Suporte',
          showEmailInfo: false,
        };
    }
  };

  const statusInfo = getStatusInfo();

  const handleAction = () => {
    if (subscription.subscription_status === 'pending' && subscription.checkout_url) {
      window.open(subscription.checkout_url, '_blank');
    } else if (statusInfo.action === 'Renovar Acesso') {
      // Aqui você pode redirecionar para o checkout da Kiwify
      window.open('https://pay.kiwify.com.br/nzX4lAh', '_blank');
    } else if (statusInfo.action === 'Entrar em Contato') {
      window.open('mailto:suporte@copymaster.app', '_blank');
    }
  };

  const handleResendEmail = () => {
    // Aqui você pode implementar o reenvio do email de checkout
    toast.success('Email reenviado com sucesso!');
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <Card className="bg-[#1E1E1E] border-[#4B5563] max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {statusInfo.icon}
          </div>
          <CardTitle className="text-white text-2xl">
            {statusInfo.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-[#CCCCCC] text-lg leading-relaxed">
            {statusInfo.description}
          </p>

          {statusInfo.showEmailInfo && (
            <div className="bg-[#2A2A2A] p-4 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-[#3B82F6]" />
                <p className="text-[#CCCCCC] text-sm font-medium">
                  Enviamos um email com o link de pagamento
                </p>
              </div>
              <p className="text-[#888888] text-xs">
                Verifique sua caixa de entrada e spam
              </p>
            </div>
          )}

          {subscription.payment_approved_at && (
            <div className="bg-[#2A2A2A] p-4 rounded-lg">
              <p className="text-[#CCCCCC] text-sm">
                Pagamento aprovado em: {new Date(subscription.payment_approved_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}

          {statusInfo.action && (
            <Button
              onClick={handleAction}
              className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white py-3"
              disabled={!subscription.checkout_url && subscription.subscription_status === 'pending'}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {statusInfo.action}
            </Button>
          )}

          {statusInfo.showEmailInfo && (
            <Button
              onClick={handleResendEmail}
              variant="outline"
              className="w-full"
            >
              <Mail className="w-4 h-4 mr-2" />
              Reenviar Email
            </Button>
          )}

          <div className="text-center">
            <p className="text-[#888888] text-sm">
              Precisa de ajuda?{' '}
              <a 
                href="mailto:suporte@copymaster.app" 
                className="text-[#3B82F6] hover:underline"
              >
                Entre em contato
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
