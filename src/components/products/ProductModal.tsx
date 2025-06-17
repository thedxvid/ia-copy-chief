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
  
  // Basic Info
  const [name, setName] = useState('');
  const [niche, setNiche] = useState('');
  const [subNiche, setSubNiche] = useState('');
  const [status, setStatus] = useState<'draft' | 'active' | 'paused' | 'archived'>('draft');
  
  // Strategy
  const [targetAudience, setTargetAudience] = useState('');
  const [marketPositioning, setMarketPositioning] = useState('');
  const [valueProposition, setValueProposition] = useState('');
  
  // Copy
  const [vslScript, setVslScript] = useState('');
  const [headline, setHeadline] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [benefits, setBenefits] = useState('');
  const [socialProof, setSocialProof] = useState('');
  
  // Offer
  const [mainOfferPromise, setMainOfferPromise] = useState('');
  const [mainOfferDescription, setMainOfferDescription] = useState('');
  const [mainOfferPrice, setMainOfferPrice] = useState('');

  // Load existing data when editing
  const loadExistingData = async (productId: string) => {
    setLoadingExistingData(true);
    try {
      // Buscar dados relacionados
      const [strategyResult, copyResult, offerResult] = await Promise.all([
        supabase.from('product_strategy').select('*').eq('product_id', productId).maybeSingle(),
        supabase.from('product_copy').select('*').eq('product_id', productId).maybeSingle(),
        supabase.from('product_offer').select('*').eq('product_id', productId).maybeSingle(),
      ]);

      // Carregar dados de estratégia
      if (strategyResult.data) {
        const strategy = strategyResult.data;
        const targetAudienceData = strategy.target_audience as TargetAudience | null;
        setTargetAudience(targetAudienceData?.description || '');
        setMarketPositioning(strategy.market_positioning || '');
        setValueProposition(strategy.value_proposition || '');
      }

      // Carregar dados de copy
      if (copyResult.data) {
        const copy = copyResult.data;
        setVslScript(copy.vsl_script || '');
        const landingPageCopy = copy.landing_page_copy as LandingPageCopy | null;
        setHeadline(landingPageCopy?.headline || '');
        setSubtitle(landingPageCopy?.subtitle || '');
        setBenefits(landingPageCopy?.benefits || '');
        setSocialProof(landingPageCopy?.social_proof || '');
      }

      // Carregar dados de oferta
      if (offerResult.data) {
        const offer = offerResult.data;
        const mainOffer = offer.main_offer as MainOffer | null;
        setMainOfferPromise(mainOffer?.promise || '');
        setMainOfferDescription(mainOffer?.description || '');
        setMainOfferPrice(mainOffer?.price || '');
      }
    } catch (error) {
      console.error('Erro ao carregar dados existentes:', error);
    } finally {
      setLoadingExistingData(false);
    }
  };

  useEffect(() => {
    if (product) {
      setName(product.name);
      setNiche(product.niche);
      setSubNiche(product.sub_niche || '');
      setStatus(product.status);
      
      // Carregar dados relacionados
      loadExistingData(product.id);
    } else {
      // Reset form
      setName('');
      setNiche('');
      setSubNiche('');
      setStatus('draft');
      setTargetAudience('');
      setMarketPositioning('');
      setValueProposition('');
      setVslScript('');
      setHeadline('');
      setSubtitle('');
      setBenefits('');
      setSocialProof('');
      setMainOfferPromise('');
      setMainOfferDescription('');
      setMainOfferPrice('');
    }
  }, [product]);

  const handleSave = async () => {
    if (!user || !name.trim() || !niche.trim()) {
      toast({
        title: "Erro",
        description: "Nome e nicho são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let productId = product?.id;

      // Create or update product
      if (product) {
        const { error } = await supabase
          .from('products')
          .update({
            name: name.trim(),
            niche: niche.trim(),
            sub_niche: subNiche.trim() || null,
            status,
          })
          .eq('id', product.id);

        if (error) throw error;
      } else {
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert({
            user_id: user.id,
            name: name.trim(),
            niche: niche.trim(),
            sub_niche: subNiche.trim() || null,
            status,
          })
          .select()
          .single();

        if (error) throw error;
        productId = newProduct.id;
      }

      // Update strategy - sempre fazer upsert se há dados preenchidos
      if (targetAudience.trim() || marketPositioning.trim() || valueProposition.trim()) {
        const strategyData = {
          product_id: productId,
          target_audience: targetAudience.trim() ? { description: targetAudience.trim() } : null,
          market_positioning: marketPositioning.trim() || null,
          value_proposition: valueProposition.trim() || null,
        };

        const { error } = await supabase
          .from('product_strategy')
          .upsert(strategyData, { onConflict: 'product_id' });

        if (error) {
          console.error('Error upserting strategy:', error);
          // Tente inserir se falhar o upsert
          const { error: insertError } = await supabase
            .from('product_strategy')
            .insert(strategyData);
          
          if (insertError) throw insertError;
        }
      }

      // Update copy - sempre fazer upsert se há dados preenchidos
      if (vslScript.trim() || headline.trim() || subtitle.trim() || benefits.trim() || socialProof.trim()) {
        const copyData = {
          product_id: productId,
          vsl_script: vslScript.trim() || null,
          landing_page_copy: {
            headline: headline.trim() || null,
            subtitle: subtitle.trim() || null,
            benefits: benefits.trim() || null,
            social_proof: socialProof.trim() || null,
          },
        };

        const { error } = await supabase
          .from('product_copy')
          .upsert(copyData, { onConflict: 'product_id' });

        if (error) {
          console.error('Error upserting copy:', error);
          // Tente inserir se falhar o upsert
          const { error: insertError } = await supabase
            .from('product_copy')
            .insert(copyData);
          
          if (insertError) throw insertError;
        }
      }

      // Update offer - sempre fazer upsert se há dados preenchidos
      if (mainOfferPromise.trim() || mainOfferDescription.trim() || mainOfferPrice.trim()) {
        const offerData = {
          product_id: productId,
          main_offer: {
            promise: mainOfferPromise.trim() || null,
            description: mainOfferDescription.trim() || null,
            price: mainOfferPrice.trim() || null,
          },
        };

        const { error } = await supabase
          .from('product_offer')
          .upsert(offerData, { onConflict: 'product_id' });

        if (error) {
          console.error('Error upserting offer:', error);
          // Tente inserir se falhar o upsert
          const { error: insertError } = await supabase
            .from('product_offer')
            .insert(offerData);
          
          if (insertError) throw insertError;
        }
      }

      toast({
        title: product ? "Produto atualizado" : "Produto criado",
        description: product 
          ? "O produto foi atualizado com sucesso." 
          : "O produto foi criado com sucesso.",
      });

      onSuccess();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o produto.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-[#1A1A1A] border-[#2A2A2A] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            {product ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
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
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Curso de Marketing Digital"
                    className="bg-[#1A1A1A] border-[#4B5563] text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="niche" className="text-white">Nicho *</Label>
                    <Input
                      id="niche"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                      placeholder="Ex: Marketing Digital"
                      className="bg-[#1A1A1A] border-[#4B5563] text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subNiche" className="text-white">Sub-nicho</Label>
                    <Input
                      id="subNiche"
                      value={subNiche}
                      onChange={(e) => setSubNiche(e.target.value)}
                      placeholder="Ex: Tráfego Pago"
                      className="bg-[#1A1A1A] border-[#4B5563] text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-white">Status</Label>
                  <Select value={status} onValueChange={(value: any) => setStatus(value)}>
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
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="Descreva seu público-alvo, suas dores e desejos..."
                    className="bg-[#1A1A1A] border-[#4B5563] text-white min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marketPositioning" className="text-white">Posicionamento de Mercado</Label>
                  <Textarea
                    id="marketPositioning"
                    value={marketPositioning}
                    onChange={(e) => setMarketPositioning(e.target.value)}
                    placeholder="Como você se posiciona no mercado..."
                    className="bg-[#1A1A1A] border-[#4B5563] text-white min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valueProposition" className="text-white">Proposta de Valor</Label>
                  <Textarea
                    id="valueProposition"
                    value={valueProposition}
                    onChange={(e) => setValueProposition(e.target.value)}
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
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Ex: Descubra Como Ganhar R$ 10k/mês com Marketing Digital"
                    className="bg-[#1A1A1A] border-[#4B5563] text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitle" className="text-white">Subtítulo</Label>
                  <Input
                    id="subtitle"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Método comprovado por mais de 1000 alunos"
                    className="bg-[#1A1A1A] border-[#4B5563] text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="benefits" className="text-white">Benefícios</Label>
                  <Textarea
                    id="benefits"
                    value={benefits}
                    onChange={(e) => setBenefits(e.target.value)}
                    placeholder="Liste os principais benefícios..."
                    className="bg-[#1A1A1A] border-[#4B5563] text-white min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="socialProof" className="text-white">Prova Social</Label>
                  <Textarea
                    id="socialProof"
                    value={socialProof}
                    onChange={(e) => setSocialProof(e.target.value)}
                    placeholder="Depoimentos, números, casos de sucesso..."
                    className="bg-[#1A1A1A] border-[#4B5563] text-white min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vslScript" className="text-white">Script VSL</Label>
                  <Textarea
                    id="vslScript"
                    value={vslScript}
                    onChange={(e) => setVslScript(e.target.value)}
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
                    value={mainOfferPromise}
                    onChange={(e) => setMainOfferPromise(e.target.value)}
                    placeholder="Ex: Ganhe R$ 10k/mês em 90 dias ou seu dinheiro de volta"
                    className="bg-[#1A1A1A] border-[#4B5563] text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mainOfferDescription" className="text-white">Descrição da Oferta</Label>
                  <Textarea
                    id="mainOfferDescription"
                    value={mainOfferDescription}
                    onChange={(e) => setMainOfferDescription(e.target.value)}
                    placeholder="Descreva o que está incluído na oferta principal..."
                    className="bg-[#1A1A1A] border-[#4B5563] text-white min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mainOfferPrice" className="text-white">Preço</Label>
                  <Input
                    id="mainOfferPrice"
                    value={mainOfferPrice}
                    onChange={(e) => setMainOfferPrice(e.target.value)}
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
            onClick={onClose}
            className="bg-transparent border-[#4B5563] text-white hover:bg-[#2A2A2A]"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || loadingExistingData || !name.trim() || !niche.trim()}
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
