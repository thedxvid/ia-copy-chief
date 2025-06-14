
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Coins } from 'lucide-react';

interface TokenInsufficientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTokenStore: () => void;
  requiredTokens: number;
  availableTokens: number;
  feature: string;
}

const getFeatureName = (feature: string) => {
  const names: Record<string, string> = {
    'generate_copy_short': 'Gerar copy curta',
    'generate_copy_long': 'Gerar copy longa', 
    'optimize_copy': 'Otimizar copy',
    'brainstorm_ideas': 'Brainstorming',
    'generate_headlines': 'Gerar headlines',
    'rewrite_copy': 'Reescrever copy',
    'analyze_competitor': 'Analisar concorrente',
    'chat_message': 'Mensagem do chat',
    'custom_agent': 'Agente personalizado'
  };
  return names[feature] || 'Funcionalidade';
};

export const TokenInsufficientModal: React.FC<TokenInsufficientModalProps> = ({
  isOpen,
  onClose,
  onOpenTokenStore,
  requiredTokens,
  availableTokens,
  feature
}) => {
  const handleBuyTokens = () => {
    onClose();
    onOpenTokenStore();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-[#1E1E1E] border-[#4B5563]/20 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            Tokens Insuficientes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-[#2A2A2A] p-4 rounded-lg border border-[#4B5563]/30">
            <h4 className="font-semibold text-white mb-2">
              {getFeatureName(feature)}
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#CCCCCC]">Tokens necessários:</span>
                <span className="text-yellow-500 font-medium">
                  {requiredTokens.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#CCCCCC]">Tokens disponíveis:</span>
                <span className="text-red-500 font-medium">
                  {availableTokens.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#4B5563]/30">
                <span className="text-[#CCCCCC]">Tokens em falta:</span>
                <span className="text-white font-semibold">
                  {(requiredTokens - availableTokens).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#3B82F6]/10 p-4 rounded-lg border border-[#3B82F6]/30">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-4 h-4 text-[#3B82F6]" />
              <span className="text-sm font-medium text-white">Solução</span>
            </div>
            <p className="text-sm text-[#CCCCCC]">
              Compre tokens extras para continuar usando todas as funcionalidades do Copy Chief.
              Os tokens extras são utilizados primeiro, preservando seus tokens mensais.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleBuyTokens}
              className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white"
            >
              <Coins className="w-4 h-4 mr-2" />
              Comprar Tokens
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
