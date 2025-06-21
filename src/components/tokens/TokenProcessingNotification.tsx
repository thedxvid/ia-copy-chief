
import React from 'react';
import { Coins, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface TokenProcessingNotificationProps {
  status: 'processing' | 'success' | 'error' | 'idle';
  message?: string;
  onClose?: () => void;
}

export const TokenProcessingNotification: React.FC<TokenProcessingNotificationProps> = ({
  status,
  message,
  onClose
}) => {
  if (status === 'idle') return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'processing':
        return {
          icon: Clock,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50 border-yellow-200',
          title: 'Processando Compra...',
          defaultMessage: 'Sua compra de tokens está sendo processada. Você receberá um e-mail de confirmação em breve.'
        };
      case 'success':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-50 border-green-200',
          title: 'Compra Aprovada!',
          defaultMessage: 'Seus tokens foram adicionados com sucesso. Verifique seu e-mail para mais detalhes.'
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-50 border-red-200',
          title: 'Erro no Processamento',
          defaultMessage: 'Houve um problema ao processar sua compra. Tente novamente ou entre em contato conosco.'
        };
      default:
        return {
          icon: Coins,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50 border-gray-200',
          title: 'Tokens',
          defaultMessage: ''
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Card className={`${config.bgColor} border-2 mb-4 shadow-lg`}>
      <CardContent className="flex items-center space-x-3 p-4">
        <div className="flex-shrink-0">
          <Icon className={`h-6 w-6 ${config.color} ${status === 'processing' ? 'animate-pulse' : ''}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 mb-1">
            {config.title}
          </h4>
          <p className="text-sm text-gray-600">
            {message || config.defaultMessage}
          </p>
        </div>
        {onClose && (status === 'success' || status === 'error') && (
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <span className="sr-only">Fechar</span>
            ×
          </button>
        )}
      </CardContent>
    </Card>
  );
};
