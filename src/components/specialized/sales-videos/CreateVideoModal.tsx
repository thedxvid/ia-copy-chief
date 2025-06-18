
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { ProductSelector } from '@/components/ui/product-selector';
import { useProducts } from '@/hooks/useProducts';
import { createProductPromptContext } from '@/utils/productContext';

interface SalesVideoBriefing {
  copy_type: string;
  product_name: string;
  product_benefits: string;
  target_audience: string;
  tone: string;
  objective: string;
  video_duration: string;
  offer_details: string;
  price_strategy: string;
  additional_info: string;
  product_id?: string;
}

interface CreateVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (briefing: SalesVideoBriefing) => Promise<void>;
  isLoading: boolean;
}

export const CreateVideoModal: React.FC<CreateVideoModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading
}) => {
  const { fetchProductDetails } = useProducts();
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>();
  const [briefing, setBriefing] = useState<SalesVideoBriefing>({
    copy_type: 'sales_video',
    product_name: '',
    product_benefits: '',
    target_audience: '',
    tone: 'professional',
    objective: '',
    video_duration: '',
    offer_details: '',
    price_strategy: '',
    additional_info: ''
  });

  // Função para aplicar informações do produto nos campos
  const applyProductToFields = async (productId: string) => {
    try {
      const productDetails = await fetchProductDetails(productId);
      if (productDetails) {
        setBriefing(prev => ({
          ...prev,
          product_id: productId,
          // Aplicar nome do produto se o campo estiver vazio
          product_name: prev.product_name || productDetails.name,
          // Aplicar público-alvo se disponível e campo estiver vazio
          target_audience: prev.target_audience || (
            productDetails.strategy?.target_audience 
              ? typeof productDetails.strategy.target_audience === 'string'
                ? productDetails.strategy.target_audience
                : JSON.stringify(productDetails.strategy.target_audience)
              : ''
          ),
          // Aplicar benefícios/proposta de valor se disponível e campo estiver vazio
          product_benefits: prev.product_benefits || (
            productDetails.strategy?.value_proposition || ''
          ),
          // Aplicar detalhes da oferta se disponível e campo estiver vazio
          offer_details: prev.offer_details || (
            productDetails.offer?.main_offer 
              ? typeof productDetails.offer.main_offer === 'string'
                ? productDetails.offer.main_offer
                : JSON.stringify(productDetails.offer.main_offer)
              : ''
          ),
          // Aplicar estratégia de preço se disponível e campo estiver vazio
          price_strategy: prev.price_strategy || (
            productDetails.offer?.pricing_strategy
              ? typeof productDetails.offer.pricing_strategy === 'string'
                ? productDetails.offer.pricing_strategy
                : JSON.stringify(productDetails.offer.pricing_strategy)
              : ''
          ),
          // Adicionar informações extras do produto no campo adicional
          additional_info: prev.additional_info + (
            productDetails.meta?.private_notes 
              ? `\n\nNotas do produto: ${productDetails.meta.private_notes}`
              : ''
          )
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes do produto:', error);
    }
  };

  // Efeito para aplicar dados do produto quando selecionado
  useEffect(() => {
    if (selectedProductId) {
      applyProductToFields(selectedProductId);
    }
  }, [selectedProductId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let enhancedBriefing = { ...briefing };
    
    // Se um produto foi selecionado, garantir que o ID está incluído
    if (selectedProductId) {
      enhancedBriefing.product_id = selectedProductId;
    }
    
    await onSubmit(enhancedBriefing);
  };

  const resetForm = () => {
    setBriefing({
      copy_type: 'sales_video',
      product_name: '',
      product_benefits: '',
      target_audience: '',
      tone: 'professional',
      objective: '',
      video_duration: '',
      offer_details: '',
      price_strategy: '',
      additional_info: ''
    });
    setSelectedProductId(undefined);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleInputChange = (field: keyof SalesVideoBriefing, value: string) => {
    setBriefing(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1E1E1E] border-[#4B5563]/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">Criar Novo Vídeo de Vendas</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <ProductSelector
            value={selectedProductId}
            onValueChange={setSelectedProductId}
            placeholder="Selecione um produto para usar como contexto"
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
              <Label htmlFor="video_duration" className="text-white">Duração do Vídeo *</Label>
              <Select value={briefing.video_duration} onValueChange={(value) => handleInputChange('video_duration', value)}>
                <SelectTrigger className="bg-[#2A2A2A] border-[#4B5563] text-white">
                  <SelectValue placeholder="Selecione a duração" />
                </SelectTrigger>
                <SelectContent className="bg-[#2A2A2A] border-[#4B5563] text-white">
                  <SelectItem value="5-10min">5-10 minutos</SelectItem>
                  <SelectItem value="10-20min">10-20 minutos</SelectItem>
                  <SelectItem value="20-40min">20-40 minutos</SelectItem>
                  <SelectItem value="40min+">Mais de 40 minutos</SelectItem>
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

          <div className="space-y-2">
            <Label htmlFor="offer_details" className="text-white">Detalhes da Oferta *</Label>
            <Textarea
              id="offer_details"
              value={briefing.offer_details}
              onChange={(e) => handleInputChange('offer_details', e.target.value)}
              placeholder="Descreva sua oferta, bônus, garantias..."
              className="min-h-20 bg-[#2A2A2A] border-[#4B5563] text-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tone" className="text-white">Tom de Voz</Label>
              <Select value={briefing.tone} onValueChange={(value) => handleInputChange('tone', value)}>
                <SelectTrigger className="bg-[#2A2A2A] border-[#4B5563] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2A2A2A] border-[#4B5563] text-white">
                  <SelectItem value="professional">Profissional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="enthusiastic">Entusiasmado</SelectItem>
                  <SelectItem value="storytelling">Storytelling</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_strategy" className="text-white">Estratégia de Preço *</Label>
              <Input
                id="price_strategy"
                value={briefing.price_strategy}
                onChange={(e) => handleInputChange('price_strategy', e.target.value)}
                placeholder="Ex: Preço âncora, Oferta limitada"
                className="bg-[#2A2A2A] border-[#4B5563] text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="objective" className="text-white">Objetivo do Vídeo *</Label>
            <Textarea
              id="objective"
              value={briefing.objective}
              onChange={(e) => handleInputChange('objective', e.target.value)}
              placeholder="O que você quer alcançar com este vídeo?"
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
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !briefing.product_name || !briefing.target_audience}
              className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                'Gerar Roteiro'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
