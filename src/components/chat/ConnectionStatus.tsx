
import React from 'react';
import { Wifi, WifiOff, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

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
          bgColor: 'bg-yellow-400/10',
          pulse: true,
          showReconnect: false
        };
      case 'connected':
        return {
          icon: <Wifi className="w-3 h-3" />,
          text: isTyping ? 'IA digitando...' : 'Online',
          color: 'text-green-400',
          bgColor: 'bg-green-400/10',
          pulse: isTyping,
          showReconnect: false
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-3 h-3" />,
          text: 'Erro na conexão',
          color: 'text-red-400',
          bgColor: 'bg-red-400/10',
          pulse: false,
          showReconnect: true
        };
      default:
        return {
          icon: <WifiOff className="w-3 h-3" />,
          text: 'Offline',
          color: 'text-gray-400',
          bgColor: 'bg-gray-400/10',
          pulse: false,
          showReconnect: true
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`flex items-center gap-2 px-2 py-1 rounded-full ${config.bgColor} ${config.color} text-xs transition-all duration-200 ${config.pulse ? 'animate-pulse' : ''}`}>
      {config.icon}
      <span className="font-medium">{config.text}</span>
      {config.showReconnect && onReconnect && (
        <button
          onClick={onReconnect}
          className="ml-1 flex items-center gap-1 px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
          title="Tentar reconectar"
        >
          <RefreshCw className="w-3 h-3" />
          Reconectar
        </button>
      )}
    </div>
  );
};
