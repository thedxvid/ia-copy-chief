
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  name: string;
  niche: string;
  sub_niche: string; // Tornar obrigatório para consistência
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProductDetails extends Product {
  strategy?: any;
  copy?: any;
  offer?: any;
  meta?: any;
}

class ProductService {
  private async validateAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('Usuário não autenticado');
    }
    return session.user;
  }

  async getProducts(): Promise<Product[]> {
    const user = await this.validateAuth();
    
    console.log('🔍 ProductService: Buscando produtos para usuário:', user.id);
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ ProductService: Erro ao buscar produtos:', error);
      throw new Error('Falha ao carregar produtos');
    }

    // Garantir que sub_niche nunca seja null/undefined
    const productsWithSubNiche = (data || []).map(product => ({
      ...product,
      sub_niche: product.sub_niche || ''
    }));

    console.log('✅ ProductService: Produtos carregados:', productsWithSubNiche.length);
    return productsWithSubNiche;
  }

  async getProductDetails(productId: string): Promise<ProductDetails | null> {
    const user = await this.validateAuth();
    
    console.log('🔍 ProductService: Buscando detalhes do produto:', productId);

    // Verificar se o produto pertence ao usuário
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', user.id) // Validação de propriedade
      .single();

    if (productError) {
      console.error('❌ ProductService: Erro ao buscar produto:', productError);
      throw new Error('Produto não encontrado ou sem permissão');
    }

    console.log('📋 ProductService: Produto base encontrado:', {
      id: product.id,
      name: product.name,
      niche: product.niche
    });

    // Buscar dados relacionados
    const [strategyResult, copyResult, offerResult, metaResult] = await Promise.all([
      supabase.from('product_strategy').select('*').eq('product_id', productId).maybeSingle(),
      supabase.from('product_copy').select('*').eq('product_id', productId).maybeSingle(),
      supabase.from('product_offer').select('*').eq('product_id', productId).maybeSingle(),
      supabase.from('product_meta').select('*').eq('product_id', productId).maybeSingle(),
    ]);

    const productDetails: ProductDetails = {
      ...product,
      sub_niche: product.sub_niche || '', // Garantir que não seja null
      strategy: strategyResult.data || undefined,
      copy: copyResult.data || undefined,
      offer: offerResult.data || undefined,
      meta: metaResult.data || undefined,
    };

    console.log('✅ ProductService: Produto completo montado:', {
      id: productDetails.id,
      hasStrategy: !!productDetails.strategy,
      hasOffer: !!productDetails.offer,
      hasCopy: !!productDetails.copy,
      hasMeta: !!productDetails.meta
    });

    return productDetails;
  }

  async createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Product> {
    const user = await this.validateAuth();
    
    console.log('➕ ProductService: Criando produto:', productData.name);

    const { data, error } = await supabase
      .from('products')
      .insert({
        ...productData,
        user_id: user.id,
        sub_niche: productData.sub_niche || '' // Garantir que não seja null
      })
      .select()
      .single();

    if (error) {
      console.error('❌ ProductService: Erro ao criar produto:', error);
      throw new Error('Falha ao criar produto');
    }

    console.log('✅ ProductService: Produto criado:', data.id);
    return {
      ...data,
      sub_niche: data.sub_niche || ''
    };
  }

  async updateProduct(productId: string, updates: Partial<Product>): Promise<Product> {
    const user = await this.validateAuth();
    
    console.log('📝 ProductService: Atualizando produto:', productId);

    const { data, error } = await supabase
      .from('products')
      .update({
        ...updates,
        sub_niche: updates.sub_niche || '' // Garantir que não seja null
      })
      .eq('id', productId)
      .eq('user_id', user.id) // Validação de propriedade
      .select()
      .single();

    if (error) {
      console.error('❌ ProductService: Erro ao atualizar produto:', error);
      throw new Error('Falha ao atualizar produto');
    }

    console.log('✅ ProductService: Produto atualizado:', data.id);
    return {
      ...data,
      sub_niche: data.sub_niche || ''
    };
  }

  async deleteProduct(productId: string): Promise<void> {
    const user = await this.validateAuth();
    
    console.log('🗑️ ProductService: Deletando produto:', productId);

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('user_id', user.id); // Validação de propriedade

    if (error) {
      console.error('❌ ProductService: Erro ao deletar produto:', error);
      throw new Error('Falha ao deletar produto');
    }

    console.log('✅ ProductService: Produto deletado:', productId);
  }

  async duplicateProduct(productId: string): Promise<Product> {
    const user = await this.validateAuth();
    
    console.log('📋 ProductService: Duplicando produto:', productId);

    // Buscar produto original (com validação de propriedade)
    const { data: originalProduct, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('❌ ProductService: Erro ao buscar produto original:', fetchError);
      throw new Error('Produto não encontrado para duplicação');
    }

    // Criar cópia
    const { data, error } = await supabase
      .from('products')
      .insert({
        user_id: user.id,
        name: `${originalProduct.name} (Cópia)`,
        niche: originalProduct.niche,
        sub_niche: originalProduct.sub_niche || '',
        status: 'draft'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ ProductService: Erro ao duplicar produto:', error);
      throw new Error('Falha ao duplicar produto');
    }

    console.log('✅ ProductService: Produto duplicado:', data.id);
    return {
      ...data,
      sub_niche: data.sub_niche || ''
    };
  }
}

export const productService = new ProductService();
