import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Edit, Copy, RefreshCw, Loader2 } from 'lucide-react';
import { useSpecializedCopies } from '@/hooks/useSpecializedCopies';
import { useAICopyGeneration, type SalesVideoBriefing } from '@/hooks/useAICopyGeneration';
import { toast } from 'sonner';

interface CreateVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateVideoModal = ({ open, onOpenChange }: CreateVideoModalProps) => {
  const { createCopy } = useSpecializedCopies('sales-videos');
  const { generateSalesVideoCopy, isGenerating, generatedContent } = useAICopyGeneration();
  
  const [activeTab, setActiveTab] = useState('ai');
  const [briefing, setBriefing] = useState<SalesVideoBriefing>({
    product_name: '',
    product_benefits: '',
    target_audience: '',
    tone: 'professional',
    objective: '',
    video_duration: '',
    offer_details: '',
    price_strategy: '',
    additional_info: '',
    copy_type: 'sales_video'
  });

  const [manualData, setManualData] = useState({
    title: '',
    hook: '',
    script: '',
    cta: '',
    duration: '',
    tags: ''
  });

  const handleAIGeneration = async () => {
    const result = await generateSalesVideoCopy(briefing);
    if (result) {
      // Auto-preenche dados manuais com o conteúdo gerado
      setManualData(prev => ({
        ...prev,
        title: `VSL ${briefing.product_name}`,
        hook: result.hook,
        script: result.script,
        cta: result.cta,
        duration: result.duration
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const copyData = {
      copy_type: 'sales-videos' as const,
      title: manualData.title || `VSL ${briefing.product_name}`,
      copy_data: {
        hook: manualData.hook,
        script: manualData.script,
        cta: manualData.cta,
        duration: manualData.duration,
        ...(activeTab === 'ai' && { ai_briefing: briefing })
      },
      tags: manualData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    };

    const result = await createCopy(copyData);
    
    if (result) {
      // Reset forms
      setBriefing({
        product_name: '',
        product_benefits: '',
        target_audience: '',
        tone: 'professional',
        objective: '',
        video_duration: '',
        offer_details: '',
        price_strategy: '',
        additional_info: '',
        copy_type: 'sales_video'
      });
      setManualData({
        title: '',
        hook: '',
        script: '',
        cta: '',
        duration: '',
        tags: ''
      });
      setActiveTab('ai');
      onOpenChange(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para área de transferência!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1E1E1E] border-[#4B5563] text-white max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#3B82F6]" />
            Criar Script de VSL
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#2A2A2A]">
            <TabsTrigger value="ai" className="data-[state=active]:bg-[#3B82F6]">
              <Sparkles className="w-4 h-4 mr-2" />
              Assistente IA
            </TabsTrigger>
            <TabsTrigger value="manual" className="data-[state=active]:bg-[#3B82F6]">
              <Edit className="w-4 h-4 mr-2" />
              Criação Manual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="space-y-6">
            <Card className="bg-[#2A2A2A] border-[#4B5563]">
              <CardHeader>
                <CardTitle className="text-white text-lg">Briefing do Vídeo</CardTitle>
                <p className="text-[#CCCCCC] text-sm">
                  Forneça as informações e a IA criará um script completo de VSL
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="product_name">Nome do Produto</Label>
                    <Input
                      id="product_name"
                      value={briefing.product_name}
                      onChange={(e) => setBriefing(prev => ({ ...prev, product_name: e.target.value }))}
                      className="bg-[#1E1E1E] border-[#4B5563] text-white"
                      placeholder="Ex: Curso de Marketing Digital"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="video_duration">Duração (minutos)</Label>
                    <Select value={briefing.video_duration} onValueChange={(value) => setBriefing(prev => ({ ...prev, video_duration: value }))}>
                      <SelectTrigger className="bg-[#1E1E1E] border-[#4B5563] text-white">
                        <SelectValue placeholder="Selecione a duração" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2A2A2A] border-[#4B5563]">
                        <SelectItem value="5-10">5-10 minutos</SelectItem>
                        <SelectItem value="10-15">10-15 minutos</SelectItem>
                        <SelectItem value="15-20">15-20 minutos</SelectItem>
                        <SelectItem value="20-30">20-30 minutos</SelectItem>
                        <SelectItem value="30+">30+ minutos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product_benefits">Principais Benefícios</Label>
                  <Textarea
                    id="product_benefits"
                    value={briefing.product_benefits}
                    onChange={(e) => setBriefing(prev => ({ ...prev, product_benefits: e.target.value }))}
                    className="bg-[#1E1E1E] border-[#4B5563] text-white min-h-[80px]"
                    placeholder="Quais os principais benefícios que seu produto oferece?"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_audience">Público-Alvo</Label>
                  <Textarea
                    id="target_audience"
                    value={briefing.target_audience}
                    onChange={(e) => setBriefing(prev => ({ ...prev, target_audience: e.target.value }))}
                    className="bg-[#1E1E1E] border-[#4B5563] text-white min-h-[80px]"
                    placeholder="Descreva seu público-alvo: idade, problemas, desejos..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offer_details">Detalhes da Oferta</Label>
                  <Textarea
                    id="offer_details"
                    value={briefing.offer_details}
                    onChange={(e) => setBriefing(prev => ({ ...prev, offer_details: e.target.value }))}
                    className="bg-[#1E1E1E] border-[#4B5563] text-white min-h-[80px]"
                    placeholder="Descreva sua oferta: preço, bônus, garantia..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tone">Tom de Voz</Label>
                    <Select value={briefing.tone} onValueChange={(value: any) => setBriefing(prev => ({ ...prev, tone: value }))}>
                      <SelectTrigger className="bg-[#1E1E1E] border-[#4B5563] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2A2A2A] border-[#4B5563]">
                        <SelectItem value="professional">Profissional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                        <SelectItem value="emotional">Emocional</SelectItem>
                        <SelectItem value="educational">Educativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price_strategy">Estratégia de Preço</Label>
                    <Input
                      id="price_strategy"
                      value={briefing.price_strategy}
                      onChange={(e) => setBriefing(prev => ({ ...prev, price_strategy: e.target.value }))}
                      className="bg-[#1E1E1E] border-[#4B5563] text-white"
                      placeholder="Ex: De R$ 997 por R$ 297"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objective">Objetivo Principal</Label>
                  <Input
                    id="objective"
                    value={briefing.objective}
                    onChange={(e) => setBriefing(prev => ({ ...prev, objective: e.target.value }))}
                    className="bg-[#1E1E1E] border-[#4B5563] text-white"
                    placeholder="Ex: Vender 100 unidades em 7 dias"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional_info">Informações Adicionais (Opcional)</Label>
                  <Textarea
                    id="additional_info"
                    value={briefing.additional_info}
                    onChange={(e) => setBriefing(prev => ({ ...prev, additional_info: e.target.value }))}
                    className="bg-[#1E1E1E] border-[#4B5563] text-white min-h-[60px]"
                    placeholder="Outras informações relevantes..."
                  />
                </div>

                <Button
                  onClick={handleAIGeneration}
                  disabled={isGenerating || !briefing.product_name || !briefing.product_benefits}
                  className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gerando Script...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Gerar Script com IA
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Script</Label>
                <Input
                  id="title"
                  value={manualData.title}
                  onChange={(e) => setManualData(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-[#2A2A2A] border-[#4B5563] text-white"
                  placeholder="Ex: VSL Produto X - Versão 2.0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duração (minutos)</Label>
                <Input
                  id="duration"
                  value={manualData.duration}
                  onChange={(e) => setManualData(prev => ({ ...prev, duration: e.target.value }))}
                  className="bg-[#2A2A2A] border-[#4B5563] text-white"
                  placeholder="Ex: 15"
                  type="number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hook">Hook Inicial (Gancho)</Label>
              {manualData.hook && (
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(manualData.hook)}
                    className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A]"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copiar
                  </Button>
                </div>
              )}
              <Textarea
                id="hook"
                value={manualData.hook}
                onChange={(e) => setManualData(prev => ({ ...prev, hook: e.target.value }))}
                className="bg-[#2A2A2A] border-[#4B5563] text-white min-h-[80px]"
                placeholder="Primeiros 30 segundos que vão prender a atenção..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="script">Script Completo</Label>
              {manualData.script && (
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(manualData.script)}
                    className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A]"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copiar
                  </Button>
                </div>
              )}
              <Textarea
                id="script"
                value={manualData.script}
                onChange={(e) => setManualData(prev => ({ ...prev, script: e.target.value }))}
                className="bg-[#2A2A2A] border-[#4B5563] text-white min-h-[200px]"
                placeholder="Digite o script completo do vídeo..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cta">Call to Action Final</Label>
              {manualData.cta && (
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(manualData.cta)}
                    className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A]"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copiar
                  </Button>
                </div>
              )}
              <Textarea
                id="cta"
                value={manualData.cta}
                onChange={(e) => setManualData(prev => ({ ...prev, cta: e.target.value }))}
                className="bg-[#2A2A2A] border-[#4B5563] text-white min-h-[80px]"
                placeholder="Como você vai pedir para a pessoa agir no final..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input
                id="tags"
                value={manualData.tags}
                onChange={(e) => setManualData(prev => ({ ...prev, tags: e.target.value }))}
                className="bg-[#2A2A2A] border-[#4B5563] text-white"
                placeholder="vsl, vendas, conversão"
              />
            </div>
          </TabsContent>
        </Tabs>

        <form onSubmit={handleSubmit}>
          <div className="flex justify-end space-x-3 pt-6 border-t border-[#4B5563]/20">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A]"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
              disabled={!manualData.title || !manualData.hook || !manualData.script || !manualData.cta}
            >
              Criar Script
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
