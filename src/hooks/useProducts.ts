
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Product {
  id: string;
  name: string;
  niche: string;
  sub_niche?: string;
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProductDetails extends Product {
  strategy?: {
    target_audience?: any;
    value_proposition?: string;
    market_positioning?: string;
  };
  copy?: {
    landing_page_copy?: any;
    vsl_script?: string;
    email_campaign?: any;
    social_media_content?: any;
    whatsapp_messages?: string[];
    telegram_messages?: string[];
  };
  offer?: {
    main_offer?: any;
    upsell?: any;
    downsell?: any;
    order_bump?: any;
    bonuses?: any[];
    pricing_strategy?: any;
  };
  meta?: {
    tags?: string[];
    private_notes?: string;
    ai_evaluation?: any;
  };
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchProducts = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setProducts(data || []);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      setError('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchProductDetails = async (productId: string): Promise<ProductDetails | null> => {
    try {
      console.log('🔍 DEBUG - Buscando detalhes do produto:', productId);

      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError) {
        console.error('❌ DEBUG - Erro ao buscar produto:', productError);
        throw productError;
      }

      console.log('📋 DEBUG - Produto base encontrado:', {
        id: product.id,
        name: product.name,
        niche: product.niche,
        sub_niche: product.sub_niche
      });

      // Buscar dados relacionados com mais detalhes de debug
      const [strategyResult, copyResult, offerResult, metaResult] = await Promise.all([
        supabase.from('product_strategy').select('*').eq('product_id', productId).maybeSingle(),
        supabase.from('product_copy').select('*').eq('product_id', productId).maybeSingle(),
        supabase.from('product_offer').select('*').eq('product_id', productId).maybeSingle(),
        supabase.from('product_meta').select('*').eq('product_id', productId).maybeSingle(),
      ]);

      console.log('🔍 DEBUG - Dados relacionados encontrados:', {
        strategy: !!strategyResult.data,
        copy: !!copyResult.data,
        offer: !!offerResult.data,
        meta: !!metaResult.data,
      });

      // Log detalhado dos dados encontrados
      if (strategyResult.data) {
        console.log('📊 DEBUG - Strategy data:', {
          hasValueProposition: !!strategyResult.data.value_proposition,
          hasTargetAudience: !!strategyResult.data.target_audience,
          hasMarketPositioning: !!strategyResult.data.market_positioning
        });
      }

      if (offerResult.data) {
        console.log('💰 DEBUG - Offer data:', {
          hasMainOffer: !!offerResult.data.main_offer,
          hasPricingStrategy: !!offerResult.data.pricing_strategy,
          hasBonuses: !!offerResult.data.bonuses,
          hasUpsell: !!offerResult.data.upsell,
          hasDownsell: !!offerResult.data.downsell,
          hasOrderBump: !!offerResult.data.order_bump
        });
      }

      if (copyResult.data) {
        console.log('📝 DEBUG - Copy data:', {
          hasVslScript: !!copyResult.data.vsl_script,
          hasLandingPageCopy: !!copyResult.data.landing_page_copy,
          hasEmailCampaign: !!copyResult.data.email_campaign,
          hasSocialMediaContent: !!copyResult.data.social_media_content,
          hasWhatsappMessages: !!copyResult.data.whatsapp_messages,
          hasTelegramMessages: !!copyResult.data.telegram_messages
        });
      }

      if (metaResult.data) {
        console.log('🏷️ DEBUG - Meta data:', {
          hasTags: !!metaResult.data.tags,
          hasPrivateNotes: !!metaResult.data.private_notes,
          hasAiEvaluation: !!metaResult.data.ai_evaluation
        });
      }

      const productDetails: ProductDetails = {
        ...product,
        strategy: strategyResult.data || undefined,
        copy: copyResult.data || undefined,
        offer: offerResult.data || undefined,
        meta: metaResult.data || undefined,
      };

      console.log('✅ DEBUG - Produto completo montado:', {
        id: productDetails.id,
        name: productDetails.name,
        hasStrategy: !!productDetails.strategy,
        hasOffer: !!productDetails.offer,
        hasCopy: !!productDetails.copy,
        hasMeta: !!productDetails.meta
      });

      return productDetails;
    } catch (err) {
      console.error('❌ DEBUG - Erro ao buscar detalhes do produto:', err);
      toast.error('Erro ao carregar detalhes do produto');
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    fetchProducts,
    fetchProductDetails,
  };
};
