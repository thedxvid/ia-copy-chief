import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Download, RefreshCw } from 'lucide-react';
import { useN8nIntegration } from '@/hooks/useN8nIntegration';
import { useAuth } from '@/contexts/AuthContext';
import { useTokens } from '@/hooks/useTokens';
import { useProducts } from '@/hooks/useProducts';
import { toast } from 'sonner';

interface ToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProductId?: string;
  tool: {
    title: string;
    type: 'headlines' | 'ads' | 'sales' | 'cta';
    description: string;
    estimatedTokens: number;
  };
}

export const ToolModal = ({ isOpen, onClose, tool, selectedProductId }: ToolModalProps) => {
  const [formData, setFormData] = useState({
    productName: '',
    niche: '',
    targetAudience: '',
    painPoints: '',
    benefits: '',
    tone: 'persuasivo',
    quantity: '5'
  });
  const [generatedContent, setGeneratedContent] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasPrefilledData, setHasPrefilledData] = useState(false);
  
  const { generateCopyWithN8n, isLoading } = useN8nIntegration();
  const { user } = useAuth();
  const { tokens, canAffordFeature } = useTokens();
  const { fetchProductDetails } = useProducts();

  // Pré-preencher dados do produto selecionado
  useEffect(() => {
    if (selectedProductId && !hasPrefilledData) {
      fetchProductDetails(selectedProductId).then(productDetails => {
        if (productDetails) {
          setFormData(prev => ({
            ...prev,
            productName: productDetails.name || prev.productName,
            niche: productDetails.niche || prev.niche,
            targetAudience: productDetails.strategy?.target_audience 
              ? (typeof productDetails.strategy.target_audience === 'string' 
                  ? productDetails.strategy.target_audience 
                  : JSON.stringify(productDetails.strategy.target_audience))
              : prev.targetAudience,
            benefits: productDetails.strategy?.value_proposition || prev.benefits
          }));
          setHasPrefilledData(true);
        }
      });
    }
  }, [selectedProductId, fetchProductDetails, hasPrefilledData]);

  // Reset preenchimento quando modal abre/fecha ou produto muda
  useEffect(() => {
    if (!isOpen) {
      setHasPrefilledData(false);
      setGeneratedContent([]);
    }
  }, [isOpen]);

  useEffect(() => {
    setHasPrefilledData(false);
  }, [selectedProductId]);

  const handleGenerate = async () => {
    if (!user?.id) {
      toast.error('Você precisa estar logado para usar esta ferramenta');
      return;
    }

    if (!canAffordFeature('copy')) {
      toast.error(`Tokens insuficientes. Você precisa de ${tool.estimatedTokens} tokens.`);
      return;
    }

    setIsGenerating(true);
    
    try {
      const customInstructions = buildInstructions();
      const productData = {
        name: formData.productName,
        niche: formData.niche,
        target_audience: formData.targetAudience,
        pain_points: formData.painPoints,
        benefits: formData.benefits,
        tone: formData.tone
      };

      const result = await generateCopyWithN8n(
        user.id,
        {},
        getGenerationType(),
        formData.targetAudience,
        JSON.stringify(productData)
      );

      if (result?.generatedCopy) {
        const content = parseGeneratedContent(result.generatedCopy);
        setGeneratedContent(content);
        toast.success('Copy gerada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao gerar copy:', error);
      toast.error('Erro ao gerar copy. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const buildInstructions = () => {
    const baseInstructions = {
      headlines: `Gere ${formData.quantity} headlines impactantes para o produto "${formData.productName}" no nicho ${formData.niche}. Foque nos pontos de dor: ${formData.painPoints} e benefícios: ${formData.benefits}. Tom: ${formData.tone}.`,
      ads: `Crie ${formData.quantity} copies para anúncios do produto "${formData.productName}". Público-alvo: ${formData.targetAudience}. Destaque os benefícios: ${formData.benefits} e resolva as dores: ${formData.painPoints}. Tom: ${formData.tone}.`,
      sales: `Desenvolva ${formData.quantity} scripts de vendas para "${formData.productName}". Estruture com abertura, apresentação do problema (${formData.painPoints}), solução (${formData.benefits}) e fechamento. Tom: ${formData.tone}.`,
      cta: `Crie ${formData.quantity} CTAs poderosos para "${formData.productName}". Devem ser diretos, urgentes e focados na ação. Considere o público: ${formData.targetAudience}. Tom: ${formData.tone}.`
    };
    
    return baseInstructions[tool.type];
  };

  const getGenerationType = () => {
    const mapping = {
      headlines: 'ads',
      ads: 'ads',
      sales: 'vsl',
      cta: 'ads'
    };
    return mapping[tool.type] as 'ads' | 'vsl';
  };

  const parseGeneratedContent = (content: string): string[] => {
    // Divide o conteúdo em itens numerados ou por quebras de linha duplas
    const items = content.split(/\n\d+\.|\n\n/).filter(item => item.trim().length > 0);
    return items.map(item => item.trim()).slice(0, parseInt(formData.quantity));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para área de transferência!');
  };

  const downloadContent = () => {
    const content = generatedContent.join('\n\n---\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tool.type}-${formData.productName || 'copy'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Arquivo baixado com sucesso!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1E1E1E] border-[#4B5563]/20">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">{tool.title}</DialogTitle>
          {selectedProductId && (
            <p className="text-[#3B82F6] text-sm">
              ✓ Contexto do produto ativo - campos foram pré-preenchidos
            </p>
          )}
        </DialogHeader>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Formulário */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Nome do Produto</Label>
              <Input
                value={formData.productName}
                onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                placeholder="Digite o nome do produto"
                className="bg-[#2A2A2A] border-[#4B5563]/40 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Nicho</Label>
              <Input
                value={formData.niche}
                onChange={(e) => setFormData(prev => ({ ...prev, niche: e.target.value }))}
                placeholder="Ex: Fitness, Marketing Digital, Culinária"
                className="bg-[#2A2A2A] border-[#4B5563]/40 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Público-Alvo</Label>
              <Input
                value={formData.targetAudience}
                onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                placeholder="Descreva seu público-alvo"
                className="bg-[#2A2A2A] border-[#4B5563]/40 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Pontos de Dor</Label>
              <Textarea
                value={formData.painPoints}
                onChange={(e) => setFormData(prev => ({ ...prev, painPoints: e.target.value }))}
                placeholder="Quais problemas seu produto resolve?"
                className="bg-[#2A2A2A] border-[#4B5563]/40 text-white"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Benefícios</Label>
              <Textarea
                value={formData.benefits}
                onChange={(e) => setFormData(prev => ({ ...prev, benefits: e.target.value }))}
                placeholder="Quais benefícios seu produto oferece?"
                className="bg-[#2A2A2A] border-[#4B5563]/40 text-white"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Tom</Label>
                <Select value={formData.tone} onValueChange={(value) => setFormData(prev => ({ ...prev, tone: value }))}>
                  <SelectTrigger className="bg-[#2A2A2A] border-[#4B5563]/40 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2A2A] border-[#4B5563]/40">
                    <SelectItem value="persuasivo">Persuasivo</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                    <SelectItem value="educativo">Educativo</SelectItem>
                    <SelectItem value="emocional">Emocional</SelectItem>
                    <SelectItem value="profissional">Profissional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Quantidade</Label>
                <Select value={formData.quantity} onValueChange={(value) => setFormData(prev => ({ ...prev, quantity: value }))}>
                  <SelectTrigger className="bg-[#2A2A2A] border-[#4B5563]/40 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2A2A] border-[#4B5563]/40">
                    <SelectItem value="3">3 opções</SelectItem>
                    <SelectItem value="5">5 opções</SelectItem>
                    <SelectItem value="10">10 opções</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-[#CCCCCC]">
                  Tokens necessários: {tool.estimatedTokens}
                </span>
                <span className="text-sm text-[#CCCCCC]">
                  Disponíveis: {tokens?.total_available || 0}
                </span>
              </div>
              
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || isLoading || !canAffordFeature('copy')}
                className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  `Gerar ${tool.title}`
                )}
              </Button>
            </div>
          </div>

          {/* Resultados */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-white">Resultado</Label>
              {generatedContent.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={downloadContent}
                    className="border-[#4B5563] text-white hover:bg-[#2A2A2A]"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {generatedContent.length > 0 ? (
                generatedContent.map((content, index) => (
                  <Card key={index} className="bg-[#2A2A2A] border-[#4B5563]/20">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="text-xs text-[#CCCCCC] mb-2">Opção {index + 1}</div>
                          <p className="text-white text-sm leading-relaxed">{content}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(content)}
                          className="text-[#CCCCCC] hover:text-white hover:bg-[#3B5563]/20"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-[#CCCCCC] mb-4">
                    Preencha o formulário e clique em "Gerar" para ver os resultados aqui.
                  </p>
                  <div className="text-xs text-[#CCCCCC]">
                    {tool.description}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
