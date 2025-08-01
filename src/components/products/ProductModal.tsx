import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useProductFormDraft } from '@/hooks/useProductFormDraft';

interface Product {
  id: string;
  name: string;
  niche: string;
  sub_niche: string | null;
  status: 'draft' | 'active' | 'paused' | 'archived';
  created_at: string;
  updated_at: string;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSuccess: () => void;
}

// Type interfaces for JSONB data
interface TargetAudience {
  description?: string;
}

interface LandingPageCopy {
  headline?: string;
  subtitle?: string;
  benefits?: string;
  social_proof?: string;
}

interface MainOffer {
  promise?: string;
  description?: string;
  price?: string;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  product,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingExistingData, setLoadingExistingData] = useState(false);
  
  // Use product form draft with auto-save
  const isEditMode = !!product;
  const { formData, setFormData, fields, clearDraft, hasRestoredData, autoSaveActive } = useProductFormDraft(isEditMode);

  // Load existing data when editing
  const loadExistingData = async (productId: string) => {
    setLoadingExistingData(true);
    try {
      console.log('🔄 Carregando dados existentes para produto:', productId);
      
      // Buscar dados relacionados
      const [strategyResult, copyResult, offerResult] = await Promise.all([
        supabase.from('product_strategy').select('*').eq('product_id', productId).maybeSingle(),
        supabase.from('product_copy').select('*').eq('product_id', productId).maybeSingle(),
        supabase.from('product_offer').select('*').eq('product_id', productId).maybeSingle(),
      ]);

      console.log('📊 Dados carregados:', {
        strategy: strategyResult.data,
        copy: copyResult.data,
        offer: offerResult.data
      });

      // Preparar dados para atualizar o formulário
      const updateData: any = {};

      // Carregar dados de estratégia
      if (strategyResult.data) {
        const strategy = strategyResult.data;
        const targetAudienceData = strategy.target_audience as TargetAudience | null;
        
        if (!formData.targetAudience) updateData.targetAudience = targetAudienceData?.description || '';
        if (!formData.marketPositioning) updateData.marketPositioning = strategy.market_positioning || '';
        if (!formData.valueProposition) updateData.valueProposition = strategy.value_proposition || '';
        
        console.log('✅ Estratégia carregada:', {
          targetAudience: targetAudienceData?.description || '',
          marketPositioning: strategy.market_positioning || '',
          valueProposition: strategy.value_proposition || ''
        });
      }

      // Carregar dados de copy
      if (copyResult.data) {
        const copy = copyResult.data;
        const landingPageCopy = copy.landing_page_copy as LandingPageCopy | null;
        
        if (!formData.vslScript) updateData.vslScript = copy.vsl_script || '';
        if (!formData.headline) updateData.headline = landingPageCopy?.headline || '';
        if (!formData.subtitle) updateData.subtitle = landingPageCopy?.subtitle || '';
        if (!formData.benefits) updateData.benefits = landingPageCopy?.benefits || '';
        if (!formData.socialProof) updateData.socialProof = landingPageCopy?.social_proof || '';
        
        console.log('✅ Copy carregado:', {
          vslScript: copy.vsl_script || '',
          headline: landingPageCopy?.headline || '',
          subtitle: landingPageCopy?.subtitle || '',
          benefits: landingPageCopy?.benefits || '',
          socialProof: landingPageCopy?.social_proof || ''
        });
      }

      // Carregar dados de oferta
      if (offerResult.data) {
        const offer = offerResult.data;
        const mainOffer = offer.main_offer as MainOffer | null;
        
        if (!formData.mainOfferPromise) updateData.mainOfferPromise = mainOffer?.promise || '';
        if (!formData.mainOfferDescription) updateData.mainOfferDescription = mainOffer?.description || '';
        if (!formData.mainOfferPrice) updateData.mainOfferPrice = mainOffer?.price || '';
        
        console.log('✅ Oferta carregada:', {
          promise: mainOffer?.promise || '',
          description: mainOffer?.description || '',
          price: mainOffer?.price || ''
        });
      }

      // Atualizar o formulário com os dados carregados
      if (Object.keys(updateData).length > 0) {
        setFormData(updateData);
      }

    } catch (error) {
      console.error('❌ Erro ao carregar dados existentes:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do produto.",
        variant: "destructive",
      });
    } finally {
      setLoadingExistingData(false);
    }
  };

  useEffect(() => {
    if (product) {
      console.log('🔄 Produto selecionado para edição:', product);
      // Para produtos existentes, carrega dados básicos e dados relacionados
      setFormData({
        name: product.name,
        niche: product.niche,
        subNiche: product.sub_niche || '',
        status: product.status,
      });
      
      // Carregar dados relacionados
      loadExistingData(product.id);
    }
  }, [product]);

  const handleSave = async () => {
    if (!user || !formData.name.trim() || !formData.niche.trim()) {
      toast({
        title: "Erro",
        description: "Nome e nicho são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    console.log('💾 Iniciando processo de salvamento...');

    try {
      let productId = product?.id;

      // Create or update product
      if (product) {
        console.log('🔄 Atualizando produto existente:', product.id);
        const { error } = await supabase
          .from('products')
          .update({
            name: formData.name.trim(),
            niche: formData.niche.trim(),
            sub_niche: formData.subNiche.trim() || null,
            status: formData.status,
          })
          .eq('id', product.id);

        if (error) throw error;
        console.log('✅ Produto atualizado com sucesso');
      } else {
        console.log('🆕 Criando novo produto');
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert({
            user_id: user.id,
            name: formData.name.trim(),
            niche: formData.niche.trim(),
            sub_niche: formData.subNiche.trim() || null,
            status: formData.status,
          })
          .select()
          .single();

        if (error) throw error;
        productId = newProduct.id;
        console.log('✅ Novo produto criado com ID:', productId);
      }

      // Preparar dados para salvar
      const strategyData = {
        product_id: productId,
        target_audience: { description: formData.targetAudience || '' },
        market_positioning: formData.marketPositioning || '',
        value_proposition: formData.valueProposition || '',
      };

      const copyData = {
        product_id: productId,
        vsl_script: formData.vslScript || '',
        landing_page_copy: {
          headline: formData.headline || '',
          subtitle: formData.subtitle || '',
          benefits: formData.benefits || '',
          social_proof: formData.socialProof || '',
        },
      };

      const offerData = {
        product_id: productId,
        main_offer: {
          promise: formData.mainOfferPromise || '',
          description: formData.mainOfferDescription || '',
          price: formData.mainOfferPrice || '',
        },
      };

      console.log('📝 Dados preparados para salvamento:', {
        strategy: strategyData,
        copy: copyData,
        offer: offerData
      });

      // Salvar estratégia usando upsert
      console.log('💾 Salvando estratégia...');
      const { error: strategyError } = await supabase
        .from('product_strategy')
        .upsert(strategyData, {
          onConflict: 'product_id',
        });

      if (strategyError) {
        console.error('❌ Erro ao salvar estratégia:', strategyError);
        throw strategyError;
      }
      console.log('✅ Estratégia salva com sucesso');

      // Salvar copy usando upsert
      console.log('💾 Salvando copy...');
      const { error: copyError } = await supabase
        .from('product_copy')
        .upsert(copyData, {
          onConflict: 'product_id',
        });

      if (copyError) {
        console.error('❌ Erro ao salvar copy:', copyError);
        throw copyError;
      }
      console.log('✅ Copy salvo com sucesso');

      // Salvar oferta usando upsert
      console.log('💾 Salvando oferta...');
      const { error: offerError } = await supabase
        .from('product_offer')
        .upsert(offerData, {
          onConflict: 'product_id',
        });

      if (offerError) {
        console.error('❌ Erro ao salvar oferta:', offerError);
        throw offerError;
      }
      console.log('✅ Oferta salva com sucesso');

      console.log('🎉 Todos os dados salvos com sucesso!');

      // Clear saved data after successful save
      clearDraft();

      toast({
        title: product ? "Produto atualizado" : "Produto criado",
        description: product 
          ? "O produto foi atualizado com sucesso." 
          : "O produto foi criado com sucesso.",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('❌ Erro no processo de salvamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o produto. Verifique o console para mais detalhes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isEditMode) {
      // Para novos produtos, perguntar se quer descartar rascunho
      if (hasRestoredData || Object.values(formData).some(value => value.trim() !== '')) {
        const shouldDiscard = window.confirm(
          'Você tem dados não salvos. Deseja descartar o rascunho?'
        );
        if (shouldDiscard) {
          clearDraft();
        }
      }
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-[#1A1A1A] border-[#2A2A2A] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
            {product ? 'Editar Produto' : 'Novo Produto'}
            {autoSaveActive && !isEditMode && (
              <span className="text-sm text-blue-400 font-normal">💾 Salvamento automático</span>
            )}
          </DialogTitle>
          {hasRestoredData && !isEditMode && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
              Dados restaurados automaticamente
            </div>
          )}
        </DialogHeader>

        {loadingExistingData && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B82F6]"></div>
            <span className="ml-2 text-[#CCCCCC]">Carregando dados...</span>
          </div>
        )}

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-[#2A2A2A]">
            <TabsTrigger value="basic" className="text-white data-[state=active]:bg-[#3B82F6]">
              Básico
            </TabsTrigger>
            <TabsTrigger value="strategy" className="text-white data-[state=active]:bg-[#3B82F6]">
              Estratégia
            </TabsTrigger>
            <TabsTrigger value="copy" className="text-white data-[state=active]:bg-[#3B82F6]">
              Copy
            </TabsTrigger>
            <TabsTrigger value="offer" className="text-white data-[state=active]:bg-[#3B82F6]">
              Oferta
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card className="bg-[#2A2A2A] border-[#4B5563]">
              <CardHeader>
                <CardTitle className="text-white">Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Nome do Produto *</Label>
                  <Input
                    id="name"
                    value={fields.name.value}
                    onChange={(e) => fields.name.onChange(e.target.value)}
                    placeholder="Ex: Curso de Marketing Digital"
                    className="bg-[#1A1A1A] border-[#4B5563] text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="niche" className="text-white">Nicho *</Label>
                    <Input
                      id="niche"
                      value={fields.niche.value}
                      onChange={(e) => fields.niche.onChange(e.target.value)}
                      placeholder="Ex: Marketing Digital"
                      className="bg-[#1A1A1A] border-[#4B5563] text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subNiche" className="text-white">Sub-nicho</Label>
                    <Input
                      id="subNiche"
                      value={fields.subNiche.value}
                      onChange={(e) => fields.subNiche.onChange(e.target.value)}
                      placeholder="Ex: Tráfego Pago"
                      className="bg-[#1A1A1A] border-[#4B5563] text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-white">Status</Label>
                  <Select value={fields.status.value} onValueChange={fields.status.onChange}>
                    <SelectTrigger className="bg-[#1A1A1A] border-[#4B5563] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="paused">Pausado</SelectItem>
                      <SelectItem value="archived">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="strategy" className="space-y-6">
            <Card className="bg-[#2A2A2A] border-[#4B5563]">
              <CardHeader>
                <CardTitle className="text-white">Estratégia do Produto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="targetAudience" className="text-white">Público-alvo</Label>
                  <Textarea
                    id="targetAudience"
                    value={fields.targetAudience.value}
                    onChange={(e) => fields.targetAudience.onChange(e.target.value)}
                    placeholder="Descreva seu público-alvo, suas dores e desejos..."
                    className="bg-[#1A1A1A] border-[#4B5563] text-white min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marketPositioning" className="text-white">Posicionamento de Mercado</Label>
                  <Textarea
                    id="marketPositioning"
                    value={fields.marketPositioning.value}
                    onChange={(e) => fields.marketPositioning.onChange(e.target.value)}
                    placeholder="Como você se posiciona no mercado..."
                    className="bg-[#1A1A1A] border-[#4B5563] text-white min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valueProposition" className="text-white">Proposta de Valor</Label>
                  <Textarea
                    id="valueProposition"
                    value={fields.valueProposition.value}
                    onChange={(e) => fields.valueProposition.onChange(e.target.value)}
                    placeholder="Qual é a sua proposta de valor única..."
                    className="bg-[#1A1A1A] border-[#4B5563] text-white min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="copy" className="space-y-6">
            <Card className="bg-[#2A2A2A] border-[#4B5563]">
              <CardHeader>
                <CardTitle className="text-white">Copywriting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="headline" className="text-white">Headline Principal</Label>
                  <Input
                    id="headline"
                    value={fields.headline.value}
                    onChange={(e) => fields.headline.onChange(e.target.value)}
                    placeholder="Ex: Descubra Como Ganhar R$ 10k/mês com Marketing Digital"
                    className="bg-[#1A1A1A] border-[#4B5563] text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitle" className="text-white">Subtítulo</Label>
                  <Input
                    id="subtitle"
                    value={fields.subtitle.value}
                    onChange={(e) => fields.subtitle.onChange(e.target.value)}
                    placeholder="Método comprovado por mais de 1000 alunos"
                    className="bg-[#1A1A1A] border-[#4B5563] text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="benefits" className="text-white">Benefícios</Label>
                  <Textarea
                    id="benefits"
                    value={fields.benefits.value}
                    onChange={(e) => fields.benefits.onChange(e.target.value)}
                    placeholder="Liste os principais benefícios..."
                    className="bg-[#1A1A1A] border-[#4B5563] text-white min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="socialProof" className="text-white">Prova Social</Label>
                  <Textarea
                    id="socialProof"
                    value={fields.socialProof.value}
                    onChange={(e) => fields.socialProof.onChange(e.target.value)}
                    placeholder="Depoimentos, números, casos de sucesso..."
                    className="bg-[#1A1A1A] border-[#4B5563] text-white min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vslScript" className="text-white">Script VSL</Label>
                  <Textarea
                    id="vslScript"
                    value={fields.vslScript.value}
                    onChange={(e) => fields.vslScript.onChange(e.target.value)}
                    placeholder="Script completo do vídeo de vendas..."
                    className="bg-[#1A1A1A] border-[#4B5563] text-white min-h-[200px]"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="offer" className="space-y-6">
            <Card className="bg-[#2A2A2A] border-[#4B5563]">
              <CardHeader>
                <CardTitle className="text-white">Estrutura da Oferta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mainOfferPromise" className="text-white">Promessa Principal</Label>
                  <Input
                    id="mainOfferPromise"
                    value={fields.mainOfferPromise.value}
                    onChange={(e) => fields.mainOfferPromise.onChange(e.target.value)}
                    placeholder="Ex: Ganhe R$ 10k/mês em 90 dias ou seu dinheiro de volta"
                    className="bg-[#1A1A1A] border-[#4B5563] text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mainOfferDescription" className="text-white">Descrição da Oferta</Label>
                  <Textarea
                    id="mainOfferDescription"
                    value={fields.mainOfferDescription.value}
                    onChange={(e) => fields.mainOfferDescription.onChange(e.target.value)}
                    placeholder="Descreva o que está incluído na oferta principal..."
                    className="bg-[#1A1A1A] border-[#4B5563] text-white min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mainOfferPrice" className="text-white">Preço</Label>
                  <Input
                    id="mainOfferPrice"
                    value={fields.mainOfferPrice.value}
                    onChange={(e) => fields.mainOfferPrice.onChange(e.target.value)}
                    placeholder="Ex: R$ 497,00"
                    className="bg-[#1A1A1A] border-[#4B5563] text-white"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-6 border-t border-[#2A2A2A]">
          <Button
            variant="outline"
            onClick={handleClose}
            className="bg-transparent border-[#4B5563] text-white hover:bg-[#2A2A2A]"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || loadingExistingData || !formData.name.trim() || !formData.niche.trim()}
            className="bg-[#3B82F6] hover:bg-[#2563EB] text-white gap-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            {product ? 'Atualizar' : 'Criar'} Produto
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};