
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Download } from 'lucide-react';
import { copyToClipboard } from '@/utils/copyExport';

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
  if (!copyData) return null;

  const handleCopyText = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      // Aqui você pode adicionar um toast de sucesso se quiser
      console.log('Texto copiado com sucesso!');
    }
  };

  const getFormattedContent = () => {
    if (!copyData.content) return 'Nenhum conteúdo disponível';

    let formattedText = '';

    if (copyData.content.landing_page_copy) {
      const lp = copyData.content.landing_page_copy;
      formattedText += `LANDING PAGE\n\n`;
      if (lp.headline) formattedText += `Headline: ${lp.headline}\n\n`;
      if (lp.subheadline) formattedText += `Subheadline: ${lp.subheadline}\n\n`;
      if (lp.cta) formattedText += `CTA: ${lp.cta}\n\n`;
      if (lp.body) formattedText += `Corpo:\n${lp.body}\n\n`;
    }

    if (copyData.content.email_campaign) {
      const email = copyData.content.email_campaign;
      formattedText += `EMAIL CAMPAIGN\n\n`;
      if (email.subject) formattedText += `Assunto: ${email.subject}\n\n`;
      if (email.body) formattedText += `Corpo:\n${email.body}\n\n`;
      if (email.cta) formattedText += `CTA: ${email.cta}\n\n`;
    }

    if (copyData.content.vsl_script) {
      formattedText += `VSL SCRIPT\n\n`;
      formattedText += copyData.content.vsl_script + '\n\n';
    }

    if (copyData.content.whatsapp_messages && copyData.content.whatsapp_messages.length > 0) {
      formattedText += `MENSAGENS WHATSAPP\n\n`;
      copyData.content.whatsapp_messages.forEach((message, index) => {
        formattedText += `Mensagem ${index + 1}:\n${message}\n\n`;
      });
    }

    if (copyData.content.telegram_messages && copyData.content.telegram_messages.length > 0) {
      formattedText += `MENSAGENS TELEGRAM\n\n`;
      copyData.content.telegram_messages.forEach((message, index) => {
        formattedText += `Mensagem ${index + 1}:\n${message}\n\n`;
      });
    }

    if (copyData.content.social_media_content) {
      formattedText += `CONTEÚDO REDES SOCIAIS\n\n`;
      const social = copyData.content.social_media_content;
      if (social.headlines) {
        formattedText += `Headlines:\n`;
        social.headlines.forEach((headline: string, index: number) => {
          formattedText += `${index + 1}. ${headline}\n`;
        });
        formattedText += '\n';
      }
      if (social.posts) {
        formattedText += `Posts:\n`;
        social.posts.forEach((post: string, index: number) => {
          formattedText += `${index + 1}. ${post}\n\n`;
        });
      }
    }

    return formattedText || 'Nenhum conteúdo disponível';
  };

  const formattedContent = getFormattedContent();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-[#1A1A1A] border-[#4B5563]/20">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white text-xl">{copyData.title}</DialogTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyText(formattedContent)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar Tudo
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4">
          <div className="bg-[#1E1E1E] p-6 rounded-lg border border-[#4B5563]/20 max-h-[60vh] overflow-y-auto">
            <pre className="text-[#CCCCCC] whitespace-pre-wrap text-sm leading-relaxed">
              {formattedContent}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
