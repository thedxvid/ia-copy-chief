
import React from 'react';
import { Wifi, WifiOff, AlertCircle, Loader2 } from 'lucide-react';

interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  isTyping?: boolean;
  onReconnect?: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  status, 
  isTyping = false, 
  onReconnect 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connecting':
        return {
          icon: <Loader2 className="w-3 h-3 animate-spin" />,
          text: 'Conectando...',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-400/10'
        };
      case 'connected':
        return {
          icon: <Wifi className="w-3 h-3" />,
          text: isTyping ? 'IA digitando...' : 'Conectado',
          color: 'text-green-400',
          bgColor: 'bg-green-400/10'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-3 h-3" />,
          text: 'Erro na conexão',
          color: 'text-red-400',
          bgColor: 'bg-red-400/10'
        };
      default:
        return {
          icon: <WifiOff className="w-3 h-3" />,
          text: 'Desconectado',
          color: 'text-gray-400',
          bgColor: 'bg-gray-400/10'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`flex items-center gap-2 px-2 py-1 rounded-full ${config.bgColor} ${config.color} text-xs transition-all duration-200`}>
      {config.icon}
      <span>{config.text}</span>
      {status === 'error' && onReconnect && (
        <button
          onClick={onReconnect}
          className="ml-1 underline hover:no-underline transition-all"
        >
          Reconectar
        </button>
      )}
    </div>
  );
};
