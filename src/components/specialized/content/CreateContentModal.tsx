import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSpecializedCopies } from '@/hooks/useSpecializedCopies';
import { useAICopyGeneration, ContentBriefing } from '@/hooks/useAICopyGeneration';
import { Loader2, Sparkles, Edit3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CreateContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateContentModal = ({ open, onOpenChange }: CreateContentModalProps) => {
  const { createCopy } = useSpecializedCopies('content');
  const { generateContentCopy, isGenerating } = useAICopyGeneration();
  const [activeTab, setActiveTab] = useState('ai');
  
  // AI Briefing state
  const [briefing, setBriefing] = useState<ContentBriefing>({
    product_name: '',
    product_benefits: '',
    target_audience: '',
    tone: 'professional',
    objective: '',
    content_type: 'post',
    content_length: 'medium',
    call_to_action: '',
    additional_info: '',
    copy_type: 'content'
  });

  // Manual form state
  const [formData, setFormData] = useState({
    title: '',
    content_type: '',
    content_title: '',
    content: '',
    hashtags: '',
    tags: ''
  });

  const [generatedContent, setGeneratedContent] = useState<any>(null);

  const handleAIGenerate = async () => {
    const result = await generateContentCopy(briefing);
    if (result) {
      setGeneratedContent(result);
    }
  };

  const handleSaveAIContent = async () => {
    if (!generatedContent) return;

    const copyData = {
      copy_type: 'content' as const,
      title: `${briefing.product_name} - ${generatedContent.content_type}`,
      copy_data: {
        content_type: generatedContent.content_type,
        title: generatedContent.title,
        content: generatedContent.content,
        hashtags: generatedContent.hashtags
      },
      tags: [briefing.content_type, briefing.tone]
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
      copy_type: 'content' as const,
      title: formData.title,
      copy_data: {
        content_type: formData.content_type,
        title: formData.content_title,
        content: formData.content,
        hashtags: formData.hashtags
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
      content_type: 'post',
      content_length: 'medium',
      call_to_action: '',
      additional_info: '',
      copy_type: 'content'
    });
    setFormData({
      title: '',
      content_type: '',
      content_title: '',
      content: '',
      hashtags: '',
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
            Criar Novo Conteúdo
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
                    <Label htmlFor="content_type">Tipo de Conteúdo</Label>
                    <Select value={briefing.content_type} onValueChange={(value: any) => setBriefing(prev => ({ ...prev, content_type: value }))}>
                      <SelectTrigger className="bg-[#2A2A2A] border-[#4B5563] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2A2A2A] border-[#4B5563]">
                        <SelectItem value="post">Post Redes Sociais</SelectItem>
                        <SelectItem value="email">Email Marketing</SelectItem>
                        <SelectItem value="newsletter">Newsletter</SelectItem>
                        <SelectItem value="blog">Artigo de Blog</SelectItem>
                        <SelectItem value="caption">Caption/Legenda</SelectItem>
                        <SelectItem value="story">Stories</SelectItem>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="content_length">Tamanho do Conteúdo</Label>
                    <Select value={briefing.content_length} onValueChange={(value: any) => setBriefing(prev => ({ ...prev, content_length: value }))}>
                      <SelectTrigger className="bg-[#2A2A2A] border-[#4B5563] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2A2A2A] border-[#4B5563]">
                        <SelectItem value="short">Curto (até 100 palavras)</SelectItem>
                        <SelectItem value="medium">Médio (100-300 palavras)</SelectItem>
                        <SelectItem value="long">Longo (300+ palavras)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="call_to_action">Call to Action</Label>
                    <Input
                      id="call_to_action"
                      value={briefing.call_to_action}
                      onChange={(e) => setBriefing(prev => ({ ...prev, call_to_action: e.target.value }))}
                      className="bg-[#2A2A2A] border-[#4B5563] text-white"
                      placeholder="Ex: Clique no link, Comente abaixo"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objective">Objetivo Principal</Label>
                  <Input
                    id="objective"
                    value={briefing.objective}
                    onChange={(e) => setBriefing(prev => ({ ...prev, objective: e.target.value }))}
                    className="bg-[#2A2A2A] border-[#4B5563] text-white"
                    placeholder="Ex: Gerar leads, Aumentar engajamento, Educar audiência"
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
                    placeholder="Qualquer informação extra sobre o produto, promoções, etc."
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
                        Gerar Conteúdo
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-[#2A2A2A] rounded-lg border border-[#4B5563]">
                  <h3 className="text-lg font-semibold text-white mb-4">Conteúdo Gerado</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-[#CCCCCC]">Título:</Label>
                      <p className="text-white mt-1 p-2 bg-[#1E1E1E] rounded border">{generatedContent.title}</p>
                    </div>
                    
                    <div>
                      <Label className="text-[#CCCCCC]">Conteúdo:</Label>
                      <div className="text-white mt-1 p-3 bg-[#1E1E1E] rounded border whitespace-pre-wrap">
                        {generatedContent.content}
                      </div>
                    </div>
                    
                    {generatedContent.hashtags && (
                      <div>
                        <Label className="text-[#CCCCCC]">Hashtags:</Label>
                        <p className="text-blue-400 mt-1 p-2 bg-[#1E1E1E] rounded border">{generatedContent.hashtags}</p>
                      </div>
                    )}
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
                    Salvar Conteúdo
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-6 mt-6">
            <form onSubmit={handleManualSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título do Conteúdo</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-[#2A2A2A] border-[#4B5563] text-white"
                    placeholder="Ex: Post Instagram - Dicas Fitness"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content_type">Tipo de Conteúdo</Label>
                  <Select value={formData.content_type} onValueChange={(value) => setFormData(prev => ({ ...prev, content_type: value }))}>
                    <SelectTrigger className="bg-[#2A2A2A] border-[#4B5563] text-white">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2A2A2A] border-[#4B5563]">
                      <SelectItem value="post">Post Redes Sociais</SelectItem>
                      <SelectItem value="email">Email Marketing</SelectItem>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                      <SelectItem value="blog">Artigo de Blog</SelectItem>
                      <SelectItem value="caption">Caption/Legenda</SelectItem>
                      <SelectItem value="story">Stories</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content_title">Título/Assunto</Label>
                <Input
                  id="content_title"
                  value={formData.content_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, content_title: e.target.value }))}
                  className="bg-[#2A2A2A] border-[#4B5563] text-white"
                  placeholder="Título do post, assunto do email, etc."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="bg-[#2A2A2A] border-[#4B5563] text-white min-h-[150px]"
                  placeholder="Escreva o conteúdo completo..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hashtags">Hashtags/Keywords</Label>
                <Input
                  id="hashtags"
                  value={formData.hashtags}
                  onChange={(e) => setFormData(prev => ({ ...prev, hashtags: e.target.value }))}
                  className="bg-[#2A2A2A] border-[#4B5563] text-white"
                  placeholder="#marketing #vendas #empreendedorismo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  className="bg-[#2A2A2A] border-[#4B5563] text-white"
                  placeholder="social media, email, blog"
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
                  Criar Conteúdo
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
