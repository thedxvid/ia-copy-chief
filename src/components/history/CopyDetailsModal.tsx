
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, TrendingUp, History, Copy } from 'lucide-react';

interface CopyData {
  id: string;
  title: string;
  type: string;
  date: string;
  status: string;
  performance: string;
  content?: {
    landing_page_copy?: any;
    email_campaign?: any;
    social_media_content?: any;
    vsl_script?: string;
    whatsapp_messages?: string[];
    telegram_messages?: string[];
  };
  product?: {
    name: string;
    niche: string;
    sub_niche?: string;
  };
}

interface CopyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  copyData: CopyData | null;
}

export const CopyDetailsModal: React.FC<CopyDetailsModalProps> = ({
  isOpen,
  onClose,
  copyData,
}) => {
  if (!copyData) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Em teste':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'Alta conversão':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Média conversão':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Baixa conversão':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderContent = () => {
    if (!copyData.content) return <p className="text-[#CCCCCC]">Nenhum conteúdo disponível</p>;

    return (
      <div className="space-y-6">
        {copyData.content.landing_page_copy && (
          <div className="bg-[#1E1E1E] p-4 rounded-lg border border-[#4B5563]/20">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-medium">Landing Page</h4>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => copyToClipboard(JSON.stringify(copyData.content?.landing_page_copy, null, 2))}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <pre className="text-[#CCCCCC] text-sm whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify(copyData.content.landing_page_copy, null, 2)}
            </pre>
          </div>
        )}

        {copyData.content.email_campaign && (
          <div className="bg-[#1E1E1E] p-4 rounded-lg border border-[#4B5563]/20">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-medium">Email Campaign</h4>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => copyToClipboard(JSON.stringify(copyData.content?.email_campaign, null, 2))}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <pre className="text-[#CCCCCC] text-sm whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify(copyData.content.email_campaign, null, 2)}
            </pre>
          </div>
        )}

        {copyData.content.vsl_script && (
          <div className="bg-[#1E1E1E] p-4 rounded-lg border border-[#4B5563]/20">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-medium">VSL Script</h4>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => copyToClipboard(copyData.content.vsl_script || '')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[#CCCCCC] whitespace-pre-wrap">{copyData.content.vsl_script}</p>
          </div>
        )}

        {copyData.content.whatsapp_messages && copyData.content.whatsapp_messages.length > 0 && (
          <div className="bg-[#1E1E1E] p-4 rounded-lg border border-[#4B5563]/20">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-medium">WhatsApp Messages</h4>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => copyToClipboard(copyData.content?.whatsapp_messages?.join('\n\n') || '')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {copyData.content.whatsapp_messages.map((message, index) => (
                <div key={index} className="bg-[#2A2A2A] p-3 rounded text-[#CCCCCC]">
                  {message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-[#1A1A1A] border-[#4B5563]/20">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">{copyData.title}</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-[#2A2A2A]">
              <TabsTrigger value="content" className="text-[#CCCCCC] data-[state=active]:text-white">
                <FileText className="w-4 h-4 mr-2" />
                Conteúdo
              </TabsTrigger>
              <TabsTrigger value="metrics" className="text-[#CCCCCC] data-[state=active]:text-white">
                <TrendingUp className="w-4 h-4 mr-2" />
                Métricas
              </TabsTrigger>
              <TabsTrigger value="info" className="text-[#CCCCCC] data-[state=active]:text-white">
                <History className="w-4 h-4 mr-2" />
                Informações
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="mt-6">
              {renderContent()}
            </TabsContent>

            <TabsContent value="metrics" className="mt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1E1E1E] p-4 rounded-lg border border-[#4B5563]/20">
                    <h4 className="text-white font-medium mb-2">Status</h4>
                    <Badge className={getStatusColor(copyData.status)}>
                      {copyData.status}
                    </Badge>
                  </div>
                  <div className="bg-[#1E1E1E] p-4 rounded-lg border border-[#4B5563]/20">
                    <h4 className="text-white font-medium mb-2">Performance</h4>
                    <Badge className={getPerformanceColor(copyData.performance)}>
                      {copyData.performance}
                    </Badge>
                  </div>
                </div>
                <div className="bg-[#1E1E1E] p-4 rounded-lg border border-[#4B5563]/20">
                  <h4 className="text-white font-medium mb-2">Métricas Simuladas</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-[#3B82F6]">2.5%</p>
                      <p className="text-[#CCCCCC] text-sm">Taxa de Conversão</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#10B981]">45%</p>
                      <p className="text-[#CCCCCC] text-sm">Taxa de Abertura</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#F59E0B]">12%</p>
                      <p className="text-[#CCCCCC] text-sm">CTR</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="info" className="mt-6">
              <div className="space-y-4">
                <div className="bg-[#1E1E1E] p-4 rounded-lg border border-[#4B5563]/20">
                  <h4 className="text-white font-medium mb-3">Informações do Produto</h4>
                  {copyData.product && (
                    <div className="space-y-2">
                      <p className="text-[#CCCCCC]"><span className="text-white">Produto:</span> {copyData.product.name}</p>
                      <p className="text-[#CCCCCC]"><span className="text-white">Nicho:</span> {copyData.product.niche}</p>
                      {copyData.product.sub_niche && (
                        <p className="text-[#CCCCCC]"><span className="text-white">Sub-nicho:</span> {copyData.product.sub_niche}</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="bg-[#1E1E1E] p-4 rounded-lg border border-[#4B5563]/20">
                  <h4 className="text-white font-medium mb-3">Detalhes da Copy</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-[#CCCCCC]">
                      <Calendar className="w-4 h-4" />
                      <span>Criado em: {copyData.date}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[#CCCCCC]">
                      <FileText className="w-4 h-4" />
                      <span>Tipo: {copyData.type}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
