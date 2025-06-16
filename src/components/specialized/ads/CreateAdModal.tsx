import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Edit, Copy, Loader2 } from 'lucide-react';
import { useSpecializedCopies } from '@/hooks/useSpecializedCopies';
import { useAICopyGeneration, type AdsBriefing } from '@/hooks/useAICopyGeneration';
import { toast } from 'sonner';

interface CreateAdModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateAdModal = ({ open, onOpenChange }: CreateAdModalProps) => {
  const { createCopy } = useSpecializedCopies('ads');
  const { generateAdsCopy, isGenerating } = useAICopyGeneration();
  
  const [activeTab, setActiveTab] = useState('ai');
  const [briefing, setBriefing] = useState<AdsBriefing>({
    product_name: '',
    product_benefits: '',
    target_audience: '',
    tone: 'professional',
    objective: '',
    platform: '',
    campaign_objective: 'sales',
    budget_range: '',
    additional_info: '',
    copy_type: 'ads'
  });

  const [manualData, setManualData] = useState({
    title: '',
    platform: '',
    headline: '',
    content: '',
    cta: '',
    tags: ''
  });

  const handleAIGeneration = async () => {
    const result = await generateAdsCopy(briefing);
    if (result) {
      setManualData(prev => ({
        ...prev,
        title: `Anúncio ${briefing.product_name} - ${briefing.platform}`,
        platform: briefing.platform,
        headline: result.headline,
        content: result.content,
        cta: result.cta
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const copyData = {
      copy_type: 'ads' as const,
      title: manualData.title,
      platform: manualData.platform,
      copy_data: {
        headline: manualData.headline,
        content: manualData.content,
        cta: manualData.cta,
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
        platform: '',
        campaign_objective: 'sales',
        budget_range: '',
        additional_info: '',
        copy_type: 'ads'
      });
      setManualData({
        title: '',
        platform: '',
        headline: '',
        content: '',
        cta: '',
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
      <DialogContent className="bg-[#1E1E1E] border-[#4B5563] text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#3B82F6]" />
            Criar Anúncio
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
                <CardTitle className="text-white text-lg">Briefing do Anúncio</CardTitle>
                <p className="text-[#CCCCCC] text-sm">
                  Forneça as informações e a IA criará um anúncio otimizado
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
                      placeholder="Ex: Curso de Vendas Online"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="platform">Plataforma</Label>
                    <Select value={briefing.platform} onValueChange={(value) => setBriefing(prev => ({ ...prev, platform: value }))}>
                      <SelectTrigger className="bg-[#1E1E1E] border-[#4B5563] text-white">
                        <SelectValue placeholder="Selecione a plataforma" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2A2A2A] border-[#4B5563]">
                        <SelectItem value="facebook">Facebook Ads</SelectItem>
                        <SelectItem value="google">Google Ads</SelectItem>
                        <SelectItem value="instagram">Instagram Ads</SelectItem>
                        <SelectItem value="linkedin">LinkedIn Ads</SelectItem>
                        <SelectItem value="youtube">YouTube Ads</SelectItem>
                        <SelectItem value="tiktok">TikTok Ads</SelectItem>
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
                    placeholder="Descreva seu público-alvo detalhadamente..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaign_objective">Objetivo da Campanha</Label>
                    <Select value={briefing.campaign_objective} onValueChange={(value: any) => setBriefing(prev => ({ ...prev, campaign_objective: value }))}>
                      <SelectTrigger className="bg-[#1E1E1E] border-[#4B5563] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2A2A2A] border-[#4B5563]">
                        <SelectItem value="sales">Vendas</SelectItem>
                        <SelectItem value="leads">Geração de Leads</SelectItem>
                        <SelectItem value="traffic">Tráfego</SelectItem>
                        <SelectItem value="awareness">Awareness</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget_range">Orçamento</Label>
                    <Input
                      id="budget_range"
                      value={briefing.budget_range}
                      onChange={(e) => setBriefing(prev => ({ ...prev, budget_range: e.target.value }))}
                      className="bg-[#1E1E1E] border-[#4B5563] text-white"
                      placeholder="Ex: R$ 100-500/dia"
                    />
                  </div>
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
                    <Label htmlFor="objective">Objetivo Específico</Label>
                    <Input
                      id="objective"
                      value={briefing.objective}
                      onChange={(e) => setBriefing(prev => ({ ...prev, objective: e.target.value }))}
                      className="bg-[#1E1E1E] border-[#4B5563] text-white"
                      placeholder="Ex: 50 vendas em 1 semana"
                      required
                    />
                  </div>
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
                      Gerando Anúncio...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Gerar Anúncio com IA
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Anúncio</Label>
                <Input
                  id="title"
                  value={manualData.title}
                  onChange={(e) => setManualData(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-[#2A2A2A] border-[#4B5563] text-white"
                  placeholder="Ex: Campanha Black Friday"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform">Plataforma</Label>
                <Select value={manualData.platform} onValueChange={(value) => setManualData(prev => ({ ...prev, platform: value }))}>
                  <SelectTrigger className="bg-[#2A2A2A] border-[#4B5563] text-white">
                    <SelectValue placeholder="Selecione a plataforma" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2A2A] border-[#4B5563]">
                    <SelectItem value="facebook">Facebook Ads</SelectItem>
                    <SelectItem value="google">Google Ads</SelectItem>
                    <SelectItem value="instagram">Instagram Ads</SelectItem>
                    <SelectItem value="linkedin">LinkedIn Ads</SelectItem>
                    <SelectItem value="youtube">YouTube Ads</SelectItem>
                    <SelectItem value="tiktok">TikTok Ads</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="headline">Headline Principal</Label>
              {manualData.headline && (
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(manualData.headline)}
                    className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A]"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copiar
                  </Button>
                </div>
              )}
              <Input
                id="headline"
                value={manualData.headline}
                onChange={(e) => setManualData(prev => ({ ...prev, headline: e.target.value }))}
                className="bg-[#2A2A2A] border-[#4B5563] text-white"
                placeholder="Digite a headline que vai chamar atenção"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Texto do Anúncio</Label>
              {manualData.content && (
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(manualData.content)}
                    className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A]"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copiar
                  </Button>
                </div>
              )}
              <Textarea
                id="content"
                value={manualData.content}
                onChange={(e) => setManualData(prev => ({ ...prev, content: e.target.value }))}
                className="bg-[#2A2A2A] border-[#4B5563] text-white min-h-[120px]"
                placeholder="Escreva o corpo do anúncio..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cta">Call to Action (CTA)</Label>
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
              <Input
                id="cta"
                value={manualData.cta}
                onChange={(e) => setManualData(prev => ({ ...prev, cta: e.target.value }))}
                className="bg-[#2A2A2A] border-[#4B5563] text-white"
                placeholder="Ex: Comprar Agora, Saiba Mais"
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
                placeholder="conversão, vendas, promoção"
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
              disabled={!manualData.title || !manualData.headline || !manualData.content || !manualData.cta}
            >
              Criar Anúncio
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
