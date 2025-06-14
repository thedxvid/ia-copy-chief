
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Download, Eye } from 'lucide-react';
import { copyToClipboard } from '@/utils/copyExport';
import { useToast } from '@/hooks/use-toast';

interface CopyData {
  id: string;
  title: string;
  type: string;
  content?: {
    landing_page_copy?: any;
    email_campaign?: any;
    social_media_content?: any;
    vsl_script?: string;
    whatsapp_messages?: string[];
    telegram_messages?: string[];
  };
}

interface CopyPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  copyData: CopyData | null;
}

export const CopyPreviewModal: React.FC<CopyPreviewModalProps> = ({
  isOpen,
  onClose,
  copyData,
}) => {
  const { toast } = useToast();

  if (!copyData) return null;

  const handleCopyText = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      toast({
        title: "Texto copiado!",
        description: "O conteúdo foi copiado para sua área de transferência"
      });
    } else {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o texto",
        variant: "destructive"
      });
    }
  };

  const getFormattedContent = () => {
    if (!copyData.content) return 'Nenhum conteúdo disponível';

    let formattedText = '';

    if (copyData.content.landing_page_copy) {
      const lp = copyData.content.landing_page_copy;
      formattedText += `🎯 LANDING PAGE\n`;
      formattedText += `${'='.repeat(20)}\n\n`;
      if (lp.headline) formattedText += `📢 HEADLINE:\n${lp.headline}\n\n`;
      if (lp.subheadline) formattedText += `📝 SUBHEADLINE:\n${lp.subheadline}\n\n`;
      if (lp.body) formattedText += `📄 CORPO DO TEXTO:\n${lp.body}\n\n`;
      if (lp.cta) formattedText += `🔥 CALL TO ACTION:\n${lp.cta}\n\n`;
    }

    if (copyData.content.email_campaign) {
      const email = copyData.content.email_campaign;
      formattedText += `📧 EMAIL MARKETING\n`;
      formattedText += `${'='.repeat(20)}\n\n`;
      if (email.subject) formattedText += `📌 ASSUNTO:\n${email.subject}\n\n`;
      if (email.body) formattedText += `📄 CORPO DO EMAIL:\n${email.body}\n\n`;
      if (email.cta) formattedText += `🔥 CALL TO ACTION:\n${email.cta}\n\n`;
    }

    if (copyData.content.vsl_script) {
      formattedText += `🎬 SCRIPT DE VENDAS\n`;
      formattedText += `${'='.repeat(20)}\n\n`;
      formattedText += copyData.content.vsl_script + '\n\n';
    }

    if (copyData.content.whatsapp_messages && copyData.content.whatsapp_messages.length > 0) {
      formattedText += `💬 MENSAGENS WHATSAPP\n`;
      formattedText += `${'='.repeat(20)}\n\n`;
      copyData.content.whatsapp_messages.forEach((message, index) => {
        formattedText += `📱 Mensagem ${index + 1}:\n${message}\n\n`;
      });
    }

    if (copyData.content.telegram_messages && copyData.content.telegram_messages.length > 0) {
      formattedText += `✈️ MENSAGENS TELEGRAM\n`;
      formattedText += `${'='.repeat(20)}\n\n`;
      copyData.content.telegram_messages.forEach((message, index) => {
        formattedText += `📱 Mensagem ${index + 1}:\n${message}\n\n`;
      });
    }

    if (copyData.content.social_media_content) {
      formattedText += `📱 CONTEÚDO REDES SOCIAIS\n`;
      formattedText += `${'='.repeat(20)}\n\n`;
      const social = copyData.content.social_media_content;
      if (social.headlines) {
        formattedText += `🏷️ HEADLINES:\n`;
        social.headlines.forEach((headline: string, index: number) => {
          formattedText += `${index + 1}. ${headline}\n`;
        });
        formattedText += '\n';
      }
      if (social.posts) {
        formattedText += `📝 POSTS:\n`;
        social.posts.forEach((post: string, index: number) => {
          formattedText += `Post ${index + 1}:\n${post}\n\n`;
        });
      }
    }

    return formattedText || 'Nenhum conteúdo disponível';
  };

  const formattedContent = getFormattedContent();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] bg-[#1A1A1A] border-[#4B5563]/20">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="w-6 h-6 text-[#3B82F6]" />
              <div>
                <DialogTitle className="text-white text-xl">{copyData.title}</DialogTitle>
                <p className="text-[#CCCCCC] text-sm mt-1">Visualização do conteúdo</p>
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
              💡 <strong>Dica:</strong> Use o botão "Copiar Tudo" para transferir todo o conteúdo para sua área de transferência,
              ou navegue até a seção "Ver Detalhes" para mais opções de download.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
