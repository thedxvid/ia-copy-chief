
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Calendar,
  RefreshCw,
  X
} from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TokenExhaustedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export const TokenExhaustedModal: React.FC<TokenExhaustedModalProps> = ({
  isOpen,
  onClose,
  onUpgrade
}) => {
  const { subscription, loading } = useSubscription();

  const getRenewalDate = () => {
    if (subscription?.subscription_expires_at) {
      return new Date(subscription.subscription_expires_at);
    }
    
    // Se não tiver data específica, assumir próximo mês
    return addDays(new Date(), 30);
  };

  const formatRenewalDate = () => {
    try {
      const renewalDate = getRenewalDate();
      return format(renewalDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (error) {
      return 'em breve';
    }
  };

  const getDaysUntilRenewal = () => {
    try {
      const renewalDate = getRenewalDate();
      const today = new Date();
      const diffTime = renewalDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    } catch (error) {
      return 0;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-xl text-red-600">
              <AlertTriangle className="h-6 w-6" />
              Seus tokens acabaram!
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mensagem principal */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-sm text-red-800 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <strong>Você não possui mais tokens disponíveis!</strong>
              </div>
              <p>Para continuar usando o IA Copy Chief sem limitações, você tem duas opções:</p>
            </div>
          </div>

          {/* Informações de renovação */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-blue-800">
                <Calendar className="h-4 w-4" />
                <strong>Renovação da Assinatura</strong>
              </div>
              
              {loading ? (
                <div className="flex items-center gap-2 text-blue-600">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Carregando informações...</span>
                </div>
              ) : (
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex items-center justify-between">
                    <span>Data de renovação:</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {formatRenewalDate()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Dias restantes:</span>
                    <Badge variant="outline" className="border-blue-300 text-blue-800">
                      {getDaysUntilRenewal()} dias
                    </Badge>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    ✨ Seus tokens serão renovados automaticamente na data acima
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Opções */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-900">
              Escolha uma opção:
            </div>
            
            <div className="grid gap-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="justify-start h-auto p-4 border-green-200 hover:bg-green-50"
              >
                <div className="text-left">
                  <div className="flex items-center gap-2 text-green-600 font-medium">
                    <RefreshCw className="h-4 w-4" />
                    Aguardar renovação automática
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Tokens renovam em {getDaysUntilRenewal()} dias
                  </div>
                </div>
              </Button>

              <Button
                onClick={() => {
                  onUpgrade();
                  onClose();
                }}
                className="justify-start h-auto p-4 bg-[#3B82F6] hover:bg-[#2563EB]"
              >
                <div className="text-left">
                  <div className="flex items-center gap-2 text-white font-medium">
                    <AlertTriangle className="h-4 w-4" />
                    Comprar tokens extras agora
                  </div>
                  <div className="text-xs text-blue-100 mt-1">
                    Continue trabalhando sem interrupções
                  </div>
                </div>
              </Button>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              💡 Os tokens extras nunca expiram e são somados ao seu saldo atual
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
