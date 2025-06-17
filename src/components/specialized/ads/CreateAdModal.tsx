
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { ProductSelector } from '@/components/ui/product-selector';
import { useProducts } from '@/hooks/useProducts';
import { useAICopyGeneration } from '@/hooks/useAICopyGeneration';

interface AdsBriefing {
  copy_type: string;
  product_name: string;
  product_benefits: string;
  target_audience: string;
  tone: 'professional' | 'casual' | 'urgent' | 'emotional' | 'educational';
  objective: string;
  platform: string;
  campaign_objective: 'sales' | 'leads' | 'traffic' | 'awareness';
  budget_range: string;
  additional_info: string;
  product_id?: string;
}

interface CreateAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (briefing: AdsBriefing, generatedCopy?: any) => Promise<void>;
  isLoading: boolean;
}

export const CreateAdModal: React.FC<CreateAdModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading
}) => {
  const { fetchProductDetails } = useProducts();
  const { generateAdsCopy, isGenerating } = useAICopyGeneration();
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const [briefing, setBriefing] = useState<AdsBriefing>({
    copy_type: 'ad',
    product_name: '',
    product_benefits: '',
    target_audience: '',
    tone: 'professional',
    objective: '',
    platform: '',
    campaign_objective: 'sales',
    budget_range: '',
    additional_info: ''
  });

  const handleProductChange = async (productId: string | undefined) => {
    setSelectedProductId(productId);
    
    if (productId) {
      const productDetails = await fetchProductDetails(productId);
      if (productDetails) {
        setBriefing(prev => ({
          ...prev,
          product_id: productId,
          product_name: productDetails.name || prev.product_name,
          product_benefits: productDetails.strategy?.value_proposition || prev.product_benefits,
          target_audience: typeof productDetails.strategy?.target_audience === 'string' 
            ? productDetails.strategy.target_audience 
            : JSON.stringify(productDetails.strategy?.target_audience) || prev.target_audience
        }));
      }
    } else {
      setBriefing(prev => ({ ...prev, product_id: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Gerar a copy primeiro
    const generatedCopy = await generateAdsCopy({
      ...briefing,
      copy_type: 'ads'
    });

    if (generatedCopy) {
      await onSubmit(briefing, generatedCopy);
    }
  };

  const resetForm = () => {
    setBriefing({
      copy_type: 'ad',
      product_name: '',
      product_benefits: '',
      target_audience: '',
      tone: 'professional',
      objective: '',
      platform: '',
      campaign_objective: 'sales',
      budget_range: '',
      additional_info: ''
    });
    setSelectedProductId(undefined);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleInputChange = (field: keyof AdsBriefing, value: string) => {
    setBriefing(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleToneChange = (value: 'professional' | 'casual' | 'urgent' | 'emotional' | 'educational') => {
    setBriefing(prev => ({
      ...prev,
      tone: value
    }));
  };

  const handleCampaignObjectiveChange = (value: 'sales' | 'leads' | 'traffic' | 'awareness') => {
    setBriefing(prev => ({
      ...prev,
      campaign_objective: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1E1E1E] border-[#4B5563]/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">Criar Novo Anúncio</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <ProductSelector
            value={selectedProductId}
            onValueChange={handleProductChange}
            showPreview={true}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_name" className="text-white">Nome do Produto *</Label>
              <Input
                id="product_name"
                value={briefing.product_name}
                onChange={(e) => handleInputChange('product_name', e.target.value)}
                placeholder="Ex: Curso de Marketing Digital"
                className="bg-[#2A2A2A] border-[#4B5563] text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform" className="text-white">Plataforma *</Label>
              <Select value={briefing.platform} onValueChange={(value) => handleInputChange('platform', value)}>
                <SelectTrigger className="bg-[#2A2A2A] border-[#4B5563] text-white">
                  <SelectValue placeholder="Selecione a plataforma" />
                </SelectTrigger>
                <SelectContent className="bg-[#2A2A2A] border-[#4B5563] text-white">
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="google">Google Ads</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product_benefits" className="text-white">Principais Benefícios *</Label>
            <Textarea
              id="product_benefits"
              value={briefing.product_benefits}
              onChange={(e) => handleInputChange('product_benefits', e.target.value)}
              placeholder="Liste os principais benefícios do seu produto..."
              className="min-h-20 bg-[#2A2A2A] border-[#4B5563] text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_audience" className="text-white">Público-Alvo *</Label>
            <Textarea
              id="target_audience"
              value={briefing.target_audience}
              onChange={(e) => handleInputChange('target_audience', e.target.value)}
              placeholder="Descreva seu público-alvo ideal..."
              className="min-h-20 bg-[#2A2A2A] border-[#4B5563] text-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tone" className="text-white">Tom de Voz</Label>
              <Select value={briefing.tone} onValueChange={handleToneChange}>
                <SelectTrigger className="bg-[#2A2A2A] border-[#4B5563] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2A2A2A] border-[#4B5563] text-white">
                  <SelectItem value="professional">Profissional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                  <SelectItem value="emotional">Emocional</SelectItem>
                  <SelectItem value="educational">Educacional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign_objective" className="text-white">Objetivo da Campanha</Label>
              <Select value={briefing.campaign_objective} onValueChange={handleCampaignObjectiveChange}>
                <SelectTrigger className="bg-[#2A2A2A] border-[#4B5563] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2A2A2A] border-[#4B5563] text-white">
                  <SelectItem value="sales">Vendas</SelectItem>
                  <SelectItem value="leads">Geração de Leads</SelectItem>
                  <SelectItem value="traffic">Tráfego</SelectItem>
                  <SelectItem value="awareness">Reconhecimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget_range" className="text-white">Faixa de Orçamento</Label>
            <Input
              id="budget_range"
              value={briefing.budget_range}
              onChange={(e) => handleInputChange('budget_range', e.target.value)}
              placeholder="Ex: R$ 1.000 - R$ 5.000"
              className="bg-[#2A2A2A] border-[#4B5563] text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objective" className="text-white">Objetivo da Campanha *</Label>
            <Textarea
              id="objective"
              value={briefing.objective}
              onChange={(e) => handleInputChange('objective', e.target.value)}
              placeholder="O que você quer alcançar com este anúncio?"
              className="min-h-20 bg-[#2A2A2A] border-[#4B5563] text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional_info" className="text-white">Informações Adicionais</Label>
            <Textarea
              id="additional_info"
              value={briefing.additional_info}
              onChange={(e) => handleInputChange('additional_info', e.target.value)}
              placeholder="Outras informações relevantes..."
              className="min-h-20 bg-[#2A2A2A] border-[#4B5563] text-white"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A]"
              disabled={isLoading || isGenerating}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isGenerating || !briefing.product_name || !briefing.target_audience}
              className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando Copy...
                </>
              ) : (
                'Gerar Anúncio'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
