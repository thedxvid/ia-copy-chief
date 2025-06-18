
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Eye, MessageSquare, Bot, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ViewCopyModalProps {
  isOpen: boolean;
  onClose: () => void;
  copyData: any;
  copyType: string;
}

export const ViewCopyModal: React.FC<ViewCopyModalProps> = ({
  isOpen,
  onClose,
  copyData,
  copyType,
}) => {
  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Texto copiado para a área de transferência!');
    } catch (err) {
      toast.error('Erro ao copiar texto');
    }
  };

  const getFormattedContent = () => {
    if (!copyData) return 'Nenhum conteúdo disponível';

    // Conversas do chat
    if (copyType === 'conversation' && copyData.content?.conversation) {
      const conversation = copyData.content.conversation;
      let formattedText = '';
      
      formattedText += `💬 CONVERSA COM ${conversation.agent_name.toUpperCase()}\n`;
      formattedText += `${'='.repeat(50)}\n\n`;
      
      if (conversation.product_name) {
        formattedText += `🎯 PRODUTO RELACIONADO: ${conversation.product_name}\n\n`;
      }
      
      conversation.messages.forEach((message: any, index: number) => {
        const timestamp = new Date(message.timestamp).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        });
        
        if (message.role === 'user') {
          formattedText += `👤 USUÁRIO [${timestamp}]:\n${message.content}\n\n`;
        } else {
          formattedText += `🤖 ${conversation.agent_name.toUpperCase()} [${timestamp}]:\n${message.content}\n\n`;
        }
      });
      
      return formattedText;
    }

    // Conteúdo de copies (código existente)
    const data = copyData.copy_data;
    if (!data) return 'Nenhum conteúdo disponível';
    
    let formattedText = '';

    // Páginas
    if (copyType === 'pages') {
      formattedText += `🎯 ${data.page_type?.toUpperCase() || 'PÁGINA'}\n`;
      formattedText += `${'='.repeat(20)}\n\n`;
      if (data.headline) formattedText += `📢 HEADLINE:\n${data.headline}\n\n`;
      if (data.subheadline) formattedText += `📝 SUBHEADLINE:\n${data.subheadline}\n\n`;
      if (data.content) formattedText += `📄 CONTEÚDO:\n${data.content}\n\n`;
      if (data.cta) formattedText += `🔥 CALL TO ACTION:\n${data.cta}\n\n`;
    }

    // Vídeos de Vendas
    if (copyType === 'sales-videos') {
      formattedText += `🎬 ${data.video_type?.toUpperCase() || 'VÍDEO DE VENDAS'}\n`;
      formattedText += `${'='.repeat(20)}\n\n`;
      if (data.hook) formattedText += `🪝 GANCHO:\n${data.hook}\n\n`;
      if (data.problem) formattedText += `❗ PROBLEMA:\n${data.problem}\n\n`;
      if (data.solution) formattedText += `✅ SOLUÇÃO:\n${data.solution}\n\n`;
      if (data.proof) formattedText += `📊 PROVA:\n${data.proof}\n\n`;
      if (data.offer) formattedText += `💰 OFERTA:\n${data.offer}\n\n`;
      if (data.cta) formattedText += `🔥 CALL TO ACTION:\n${data.cta}\n\n`;
      if (data.script) formattedText += `📝 ROTEIRO COMPLETO:\n${data.script}\n\n`;
    }

    // Conteúdos
    if (copyType === 'content') {
      formattedText += `✍️ ${data.content_type?.toUpperCase() || 'CONTEÚDO'}\n`;
      formattedText += `${'='.repeat(20)}\n\n`;
      if (data.title) formattedText += `📝 TÍTULO:\n${data.title}\n\n`;
      if (data.subtitle) formattedText += `📄 SUBTÍTULO:\n${data.subtitle}\n\n`;
      if (data.content) formattedText += `📄 CONTEÚDO:\n${data.content}\n\n`;
      if (data.hashtags) formattedText += `#️⃣ HASHTAGS:\n${data.hashtags}\n\n`;
      if (data.cta) formattedText += `🔥 CALL TO ACTION:\n${data.cta}\n\n`;
    }

    return formattedText || 'Nenhum conteúdo disponível';
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'published': { color: 'bg-green-500/20 text-green-500', label: 'Publicado' },
      'draft': { color: 'bg-yellow-500/20 text-yellow-500', label: 'Rascunho' },
      'archived': { color: 'bg-gray-500/20 text-gray-500', label: 'Arquivado' },
      'Concluído': { color: 'bg-green-500/20 text-green-500', label: 'Concluído' },
      'Em teste': { color: 'bg-yellow-500/20 text-yellow-500', label: 'Em teste' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.draft;
    
    return (
      <Badge variant="secondary" className={`${statusInfo.color} text-xs`}>
        {statusInfo.label}
      </Badge>
    );
  };

  const renderConversationContent = () => {
    if (copyType !== 'conversation' || !copyData.content?.conversation) return null;

    const conversation = copyData.content.conversation;
    
    return (
      <div className="space-y-4">
        {conversation.product_name && (
          <div className="bg-[#2A2A2A] p-3 rounded-lg border border-[#4B5563]/20">
            <p className="text-[#CCCCCC] text-sm">
              🎯 <strong>Produto relacionado:</strong> {conversation.product_name}
            </p>
          </div>
        )}
        
        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {conversation.messages.map((message: any, index: number) => (
            <div
              key={index}
              className={`flex items-start space-x-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 bg-[#3B82F6] rounded-2xl flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div
                className={`max-w-[80%] p-3 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-[#3B82F6] text-white'
                    : 'bg-[#2A2A2A] text-white border border-[#4B5563]/20'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <div className="text-xs opacity-70 mt-2">
                  {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 bg-[#4B5563] rounded-2xl flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const formattedContent = getFormattedContent();

  if (!copyData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] bg-[#1A1A1A] border-[#4B5563]/20">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {copyType === 'conversation' ? (
                <MessageSquare className="w-6 h-6 text-[#3B82F6]" />
              ) : (
                <Eye className="w-6 h-6 text-[#3B82F6]" />
              )}
              <div>
                <DialogTitle className="text-white text-xl">{copyData.title}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[#CCCCCC] text-sm">
                    Criado em: {copyData.date || new Date(copyData.created_at || Date.now()).toLocaleDateString('pt-BR')}
                  </p>
                  {getStatusBadge(copyData.status)}
                  {copyType === 'conversation' && copyData.conversation_data && (
                    <Badge variant="outline" className="text-[#CCCCCC] border-[#4B5563] text-xs">
                      {copyData.conversation_data.message_count} mensagens
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyText(formattedContent)}
                className="border-[#4B5563] text-[#CCCCCC] hover:text-white hover:bg-[#4B5563]/20"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar Tudo
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4">
          {copyType === 'conversation' ? (
            renderConversationContent()
          ) : (
            <>
              <div className="bg-[#1E1E1E] p-6 rounded-lg border border-[#4B5563]/20 max-h-[60vh] overflow-y-auto">
                <pre className="text-[#CCCCCC] whitespace-pre-wrap text-sm leading-relaxed font-mono">
                  {formattedContent}
                </pre>
              </div>
              
              <div className="mt-4 p-4 bg-[#2A2A2A] rounded-lg border border-[#4B5563]/20">
                <p className="text-[#CCCCCC] text-sm">
                  💡 <strong>Dica:</strong> Use o botão "Copiar Tudo" para transferir todo o conteúdo para sua área de transferência.
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
