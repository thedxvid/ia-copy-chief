
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
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      // Buscar dados relacionados
      const [strategyResult, copyResult, offerResult, metaResult] = await Promise.all([
        supabase.from('product_strategy').select('*').eq('product_id', productId).maybeSingle(),
        supabase.from('product_copy').select('*').eq('product_id', productId).maybeSingle(),
        supabase.from('product_offer').select('*').eq('product_id', productId).maybeSingle(),
        supabase.from('product_meta').select('*').eq('product_id', productId).maybeSingle(),
      ]);

      return {
        ...product,
        strategy: strategyResult.data || undefined,
        copy: copyResult.data || undefined,
        offer: offerResult.data || undefined,
        meta: metaResult.data || undefined,
      };
    } catch (err) {
      console.error('Erro ao buscar detalhes do produto:', err);
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
