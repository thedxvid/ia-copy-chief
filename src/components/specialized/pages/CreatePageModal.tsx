
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertCircle } from 'lucide-react';
import { ProductSelector } from '@/components/ui/product-selector';
import { useProducts } from '@/hooks/useProducts';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PagesBriefing {
  copy_type: string;
  product_name: string;
  product_benefits: string;
  target_audience: string;
  tone: string;
  objective: string;
  page_type: string;
  conversion_goal: string;
  main_offer: string;
  additional_info: string;
  product_id?: string;
}

interface CreatePageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (briefing: PagesBriefing) => Promise<void>;
  isLoading: boolean;
}

export const CreatePageModal: React.FC<CreatePageModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading
}) => {
  const { fetchProductDetails } = useProducts();
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const [hasProductContext, setHasProductContext] = useState(false);
  const [briefing, setBriefing] = useState<PagesBriefing>({
    copy_type: 'page',
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

  const handleProductChange = async (productId: string | undefined) => {
    setSelectedProductId(productId);
    
    if (productId) {
      const productDetails = await fetchProductDetails(productId);
      if (productDetails) {
        // Check if product has meaningful context
        const hasStrategy = productDetails.strategy?.value_proposition || productDetails.strategy?.target_audience;
        const hasOffer = productDetails.offer?.main_offer;
        const hasContextData = hasStrategy || hasOffer;
        
        setHasProductContext(hasContextData);
        
        if (hasContextData) {
          setBriefing(prev => ({
            ...prev,
            product_id: productId,
            product_name: productDetails.name || prev.product_name,
            product_benefits: productDetails.strategy?.value_proposition || prev.product_benefits,
            target_audience: typeof productDetails.strategy?.target_audience === 'string' 
              ? productDetails.strategy.target_audience 
              : JSON.stringify(productDetails.strategy?.target_audience) || prev.target_audience,
            main_offer: typeof productDetails.offer?.main_offer === 'string'
              ? productDetails.offer.main_offer
              : JSON.stringify(productDetails.offer?.main_offer) || prev.main_offer
          }));
        } else {
          setBriefing(prev => ({ 
            ...prev, 
            product_id: productId,
            product_name: productDetails.name || prev.product_name
          }));
        }
      }
    } else {
      setBriefing(prev => ({ ...prev, product_id: undefined }));
      setHasProductContext(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(briefing);
  };

  const resetForm = () => {
    setBriefing({
      copy_type: 'page',
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
    setSelectedProductId(undefined);
    setHasProductContext(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleInputChange = (field: keyof PagesBriefing, value: string) => {
    setBriefing(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isFieldRequired = (field: string) => {
    if (!selectedProductId) return true;
    if (!hasProductContext) return true;
    
    // If product has context, these fields are auto-filled and not required to be manually filled
    const autoFilledFields = ['product_benefits', 'target_audience', 'main_offer'];
    return !autoFilledFields.includes(field);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1E1E1E] border-[#4B5563]/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">Criar Nova Página</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <ProductSelector
            value={selectedProductId}
            onValueChange={handleProductChange}
            showPreview={true}
          />

          {selectedProductId && !hasProductContext && (
            <Alert className="bg-orange-500/10 border-orange-500/20">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <AlertDescription className="text-orange-200">
                Este produto ainda não possui contexto preenchido (estratégia, público-alvo, ofertas). 
                Você precisará preencher as informações manualmente.
              </AlertDescription>
            </Alert>
          )}

          {selectedProductId && hasProductContext && (
            <Alert className="bg-green-500/10 border-green-500/20">
              <AlertCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-200">
                ✅ Produto com contexto detectado! Os campos foram preenchidos automaticamente usando as informações do produto.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_name" className="text-white">
                Nome do Produto {isFieldRequired('product_name') && '*'}
              </Label>
              <Input
                id="product_name"
                value={briefing.product_name}
                onChange={(e) => handleInputChange('product_name', e.target.value)}
                placeholder="Ex: Curso de Marketing Digital"
                className="bg-[#2A2A2A] border-[#4B5563] text-white"
                required={isFieldRequired('product_name')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="page_type" className="text-white">Tipo de Página *</Label>
              <Select value={briefing.page_type} onValueChange={(value) => handleInputChange('page_type', value)}>
                <SelectTrigger className="bg-[#2A2A2A] border-[#4B5563] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2A2A2A] border-[#4B5563] text-white">
                  <SelectItem value="landing">Landing Page</SelectItem>
                  <SelectItem value="sales">Página de Vendas</SelectItem>
                  <SelectItem value="capture">Página de Captura</SelectItem>
                  <SelectItem value="checkout">Página de Checkout</SelectItem>
                  <SelectItem value="thank-you">Página de Obrigado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product_benefits" className="text-white">
              Principais Benefícios {isFieldRequired('product_benefits') && '*'}
            </Label>
            <Textarea
              id="product_benefits"
              value={briefing.product_benefits}
              onChange={(e) => handleInputChange('product_benefits', e.target.value)}
              placeholder={hasProductContext ? "Preenchido automaticamente com base no produto selecionado" : "Liste os principais benefícios do seu produto..."}
              className="min-h-20 bg-[#2A2A2A] border-[#4B5563] text-white"
              required={isFieldRequired('product_benefits')}
              disabled={hasProductContext && !!briefing.product_benefits}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_audience" className="text-white">
              Público-Alvo {isFieldRequired('target_audience') && '*'}
            </Label>
            <Textarea
              id="target_audience"
              value={briefing.target_audience}
              onChange={(e) => handleInputChange('target_audience', e.target.value)}
              placeholder={hasProductContext ? "Preenchido automaticamente com base no produto selecionado" : "Descreva seu público-alvo ideal..."}
              className="min-h-20 bg-[#2A2A2A] border-[#4B5563] text-white"
              required={isFieldRequired('target_audience')}
              disabled={hasProductContext && !!briefing.target_audience}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="main_offer" className="text-white">
              Oferta Principal {isFieldRequired('main_offer') && '*'}
            </Label>
            <Textarea
              id="main_offer"
              value={briefing.main_offer}
              onChange={(e) => handleInputChange('main_offer', e.target.value)}
              placeholder={hasProductContext ? "Preenchido automaticamente com base no produto selecionado" : "Descreva sua oferta principal e preço..."}
              className="min-h-20 bg-[#2A2A2A] border-[#4B5563] text-white"
              required={isFieldRequired('main_offer')}
              disabled={hasProductContext && !!briefing.main_offer}
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
                  <SelectItem value="persuasive">Persuasivo</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conversion_goal" className="text-white">Meta de Conversão *</Label>
              <Input
                id="conversion_goal"
                value={briefing.conversion_goal}
                onChange={(e) => handleInputChange('conversion_goal', e.target.value)}
                placeholder="Ex: Venda, Cadastro, Download"
                className="bg-[#2A2A2A] border-[#4B5563] text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="objective" className="text-white">Objetivo da Página *</Label>
            <Textarea
              id="objective"
              value={briefing.objective}
              onChange={(e) => handleInputChange('objective', e.target.value)}
              placeholder="O que você quer alcançar com esta página?"
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
              disabled={isLoading || !briefing.product_name || !briefing.objective || !briefing.conversion_goal}
              className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                'Gerar Página'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
