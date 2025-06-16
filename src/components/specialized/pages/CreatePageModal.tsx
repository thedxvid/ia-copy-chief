import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSpecializedCopies } from '@/hooks/useSpecializedCopies';
import { useAICopyGeneration, PagesBriefing } from '@/hooks/useAICopyGeneration';
import { Loader2, Sparkles, Edit3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CreatePageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreatePageModal = ({ open, onOpenChange }: CreatePageModalProps) => {
  const { createCopy } = useSpecializedCopies('pages');
  const { generatePageCopy, isGenerating } = useAICopyGeneration();
  const [activeTab, setActiveTab] = useState('ai');
  
  // AI Briefing state
  const [briefing, setBriefing] = useState<PagesBriefing>({
    product_name: '',
    product_benefits: '',
    target_audience: '',
    tone: 'professional',
    objective: '',
    page_type: 'landing',
    conversion_goal: '',
    main_offer: '',
    additional_info: ''
  });

  // Manual form state
  const [formData, setFormData] = useState({
    title: '',
    page_type: '',
    headline: '',
    subheadline: '',
    content: '',
    cta: '',
    tags: ''
  });

  const [generatedContent, setGeneratedContent] = useState<any>(null);

  const handleAIGenerate = async () => {
    const result = await generatePageCopy(briefing);
    if (result) {
      setGeneratedContent(result);
    }
  };

  const handleSaveAIContent = async () => {
    if (!generatedContent) return;

    const copyData = {
      copy_type: 'pages' as const,
      title: `${briefing.product_name} - ${generatedContent.page_type}`,
      copy_data: {
        page_type: generatedContent.page_type,
        headline: generatedContent.headline,
        subheadline: generatedContent.subheadline,
        content: generatedContent.content,
        cta: generatedContent.cta
      },
      tags: [briefing.page_type, briefing.tone]
    };

    const result = await createCopy(copyData);
    
    if (result) {
      resetForms();
      onOpenChange(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const copyData = {
      copy_type: 'pages' as const,
      title: formData.title,
      copy_data: {
        page_type: formData.page_type,
        headline: formData.headline,
        subheadline: formData.subheadline,
        content: formData.content,
        cta: formData.cta
      },
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    };

    const result = await createCopy(copyData);
    
    if (result) {
      resetForms();
      onOpenChange(false);
    }
  };

  const resetForms = () => {
    setBriefing({
      product_name: '',
      product_benefits: '',
      target_audience: '',
      tone: 'professional',
      objective: '',
      page_type: 'landing',
      conversion_goal: '',
      main_offer: '',
      additional_info: ''
    });
    setFormData({
      title: '',
      page_type: '',
      headline: '',
      subheadline: '',
      content: '',
      cta: '',
      tags: ''
    });
    setGeneratedContent(null);
    setActiveTab('ai');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1E1E1E] border-[#4B5563] text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            Criar Nova Página
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#2A2A2A]">
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Gerar com IA
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              Criar Manual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="space-y-6 mt-6">
            {!generatedContent ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="product_name">Nome do Produto/Serviço</Label>
                    <Input
                      id="product_name"
                      value={briefing.product_name}
                      onChange={(e) => setBriefing(prev => ({ ...prev, product_name: e.target.value }))}
                      className="bg-[#2A2A2A] border-[#4B5563] text-white"
                      placeholder="Ex: Curso de Marketing Digital"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="page_type">Tipo de Página</Label>
                    <Select value={briefing.page_type} onValueChange={(value: any) => setBriefing(prev => ({ ...prev, page_type: value }))}>
                      <SelectTrigger className="bg-[#2A2A2A] border-[#4B5563] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2A2A2A] border-[#4B5563]">
                        <SelectItem value="landing">Landing Page</SelectItem>
                        <SelectItem value="sales">Sales Page</SelectItem>
                        <SelectItem value="squeeze">Squeeze Page</SelectItem>
                        <SelectItem value="thank-you">Thank You Page</SelectItem>
                        <SelectItem value="webinar">Página de Webinar</SelectItem>
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
                    className="bg-[#2A2A2A] border-[#4B5563] text-white"
                    placeholder="Liste os principais benefícios do seu produto/serviço"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target_audience">Público-Alvo</Label>
                    <Input
                      id="target_audience"
                      value={briefing.target_audience}
                      onChange={(e) => setBriefing(prev => ({ ...prev, target_audience: e.target.value }))}
                      className="bg-[#2A2A2A] border-[#4B5563] text-white"
                      placeholder="Ex: Empreendedores iniciantes, 25-45 anos"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tone">Tom de Voz</Label>
                    <Select value={briefing.tone} onValueChange={(value: any) => setBriefing(prev => ({ ...prev, tone: value }))}>
                      <SelectTrigger className="bg-[#2A2A2A] border-[#4B5563] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2A2A2A] border-[#4B5563]">
                        <SelectItem value="professional">Profissional</SelectItem>
                        <SelectItem value="casual">Casual/Descontraído</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                        <SelectItem value="emotional">Emocional</SelectItem>
                        <SelectItem value="educational">Educativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="main_offer">Oferta Principal</Label>
                  <Input
                    id="main_offer"
                    value={briefing.main_offer}
                    onChange={(e) => setBriefing(prev => ({ ...prev, main_offer: e.target.value }))}
                    className="bg-[#2A2A2A] border-[#4B5563] text-white"
                    placeholder="Ex: 50% de desconto por tempo limitado"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conversion_goal">Objetivo de Conversão</Label>
                  <Input
                    id="conversion_goal"
                    value={briefing.conversion_goal}
                    onChange={(e) => setBriefing(prev => ({ ...prev, conversion_goal: e.target.value }))}
                    className="bg-[#2A2A2A] border-[#4B5563] text-white"
                    placeholder="Ex: Capturar emails, Vender produto, Agendar consulta"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objective">Objetivo Principal</Label>
                  <Input
                    id="objective"
                    value={briefing.objective}
                    onChange={(e) => setBriefing(prev => ({ ...prev, objective: e.target.value }))}
                    className="bg-[#2A2A2A] border-[#4B5563] text-white"
                    placeholder="Ex: Aumentar vendas, Capturar leads qualificados"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional_info">Informações Adicionais</Label>
                  <Textarea
                    id="additional_info"
                    value={briefing.additional_info}
                    onChange={(e) => setBriefing(prev => ({ ...prev, additional_info: e.target.value }))}
                    className="bg-[#2A2A2A] border-[#4B5563] text-white"
                    placeholder="Qualquer informação extra sobre o produto, promoções, garantias, etc."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => onOpenChange(false)}
                    className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A]"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleAIGenerate}
                    disabled={isGenerating || !briefing.product_name || !briefing.product_benefits}
                    className="bg-[#3B82F6] hover:bg-[#2563EB] text-white disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Gerar Página
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-[#2A2A2A] rounded-lg border border-[#4B5563]">
                  <h3 className="text-lg font-semibold text-white mb-4">Página Gerada</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-[#CCCCCC]">Headline:</Label>
                      <p className="text-white mt-1 p-2 bg-[#1E1E1E] rounded border font-semibold">{generatedContent.headline}</p>
                    </div>
                    
                    {generatedContent.subheadline && (
                      <div>
                        <Label className="text-[#CCCCCC]">Subheadline:</Label>
                        <p className="text-white mt-1 p-2 bg-[#1E1E1E] rounded border">{generatedContent.subheadline}</p>
                      </div>
                    )}
                    
                    <div>
                      <Label className="text-[#CCCCCC]">Conteúdo:</Label>
                      <div className="text-white mt-1 p-3 bg-[#1E1E1E] rounded border whitespace-pre-wrap">
                        {generatedContent.content}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-[#CCCCCC]">Call to Action:</Label>
                      <p className="text-green-400 mt-1 p-2 bg-[#1E1E1E] rounded border font-semibold">{generatedContent.cta}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setGeneratedContent(null)}
                    className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A]"
                  >
                    Gerar Novamente
                  </Button>
                  <Button 
                    onClick={handleSaveAIContent}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Salvar Página
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-6 mt-6">
            <form onSubmit={handleManualSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título da Página</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-[#2A2A2A] border-[#4B5563] text-white"
                    placeholder="Ex: Landing Page Produto X"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="page_type">Tipo de Página</Label>
                  <Select value={formData.page_type} onValueChange={(value) => setFormData(prev => ({ ...prev, page_type: value }))}>
                    <SelectTrigger className="bg-[#2A2A2A] border-[#4B5563] text-white">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2A2A2A] border-[#4B5563]">
                      <SelectItem value="landing">Landing Page</SelectItem>
                      <SelectItem value="sales">Sales Page</SelectItem>
                      <SelectItem value="squeeze">Squeeze Page</SelectItem>
                      <SelectItem value="thank-you">Thank You Page</SelectItem>
                      <SelectItem value="webinar">Página de Webinar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="headline">Headline Principal</Label>
                <Input
                  id="headline"
                  value={formData.headline}
                  onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
                  className="bg-[#2A2A2A] border-[#4B5563] text-white"
                  placeholder="Digite a headline principal da página"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subheadline">Subheadline</Label>
                <Input
                  id="subheadline"
                  value={formData.subheadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, subheadline: e.target.value }))}
                  className="bg-[#2A2A2A] border-[#4B5563] text-white"
                  placeholder="Subheadline de apoio"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo da Página</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="bg-[#2A2A2A] border-[#4B5563] text-white min-h-[150px]"
                  placeholder="Escreva o conteúdo principal da página..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cta">Call to Action</Label>
                <Input
                  id="cta"
                  value={formData.cta}
                  onChange={(e) => setFormData(prev => ({ ...prev, cta: e.target.value }))}
                  className="bg-[#2A2A2A] border-[#4B5563] text-white"
                  placeholder="Ex: Garanta sua vaga agora"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  className="bg-[#2A2A2A] border-[#4B5563] text-white"
                  placeholder="landing, conversão, vendas"
                />
              </div>

              <div className="flex justify-end space-x-3">
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
                >
                  Criar Página
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
