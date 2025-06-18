
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Eye } from 'lucide-react';
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
    if (!copyData?.copy_data) return 'Nenhum conteúdo disponível';

    const data = copyData.copy_data;
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
      'archived': { color: 'bg-gray-500/20 text-gray-500', label: 'Arquivado' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.draft;
    
    return (
      <Badge variant="secondary" className={`${statusInfo.color} text-xs`}>
        {statusInfo.label}
      </Badge>
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
              <Eye className="w-6 h-6 text-[#3B82F6]" />
              <div>
                <DialogTitle className="text-white text-xl">{copyData.title}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[#CCCCCC] text-sm">
                    Criado em: {new Date(copyData.created_at).toLocaleDateString('pt-BR')}
                  </p>
                  {getStatusBadge(copyData.status)}
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
