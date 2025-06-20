
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { productService, type Product, type ProductDetails } from '@/services/productService';
import { securityService } from '@/services/securityService';

// Re-export types for other components
export type { Product, ProductDetails };

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

      // Log da ação para auditoria
      await securityService.logAction('FETCH_PRODUCTS', 'products');

      // Verificar rate limit
      const canProceed = await securityService.checkRateLimit('FETCH_PRODUCTS', 30, 60000);
      if (!canProceed) {
        throw new Error('Muitas requisições. Aguarde um momento.');
      }

      const data = await productService.getProducts();
      setProducts(data);

      console.log('✅ useProducts: Produtos carregados via serviço:', data.length);
    } catch (err) {
      console.error('❌ useProducts: Erro ao buscar produtos:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar produtos';
      setError(errorMessage);
      
      toast.error('Erro ao carregar produtos', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchProductDetails = async (productId: string): Promise<ProductDetails | null> => {
    try {
      console.log('🔍 useProducts: Buscando detalhes via serviço:', productId);

      // Validar acesso ao recurso
      const hasAccess = await securityService.validateResourceAccess('product', productId, 'READ');
      if (!hasAccess) {
        toast.error('Acesso negado', {
          description: 'Você não tem permissão para acessar este produto',
        });
        return null;
      }

      // Log da ação
      await securityService.logAction('FETCH_PRODUCT_DETAILS', `product:${productId}`);

      const data = await productService.getProductDetails(productId);
      
      console.log('✅ useProducts: Detalhes carregados via serviço');
      return data;
    } catch (err) {
      console.error('❌ useProducts: Erro ao buscar detalhes:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar detalhes do produto';
      toast.error('Erro ao carregar detalhes', {
        description: errorMessage,
      });
      return null;
    }
  };

  const createProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Product | null> => {
    try {
      // Log da ação
      await securityService.logAction('CREATE_PRODUCT', 'products', { name: productData.name });

      // Verificar rate limit
      const canProceed = await securityService.checkRateLimit('CREATE_PRODUCT', 10, 60000);
      if (!canProceed) {
        throw new Error('Muitas criações de produto. Aguarde um momento.');
      }

      const data = await productService.createProduct(productData);
      
      // Atualizar lista local
      setProducts(prev => [data, ...prev]);
      
      toast.success('Produto criado', {
        description: `${data.name} foi criado com sucesso.`,
      });

      return data;
    } catch (err) {
      console.error('❌ useProducts: Erro ao criar produto:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar produto';
      toast.error('Erro ao criar produto', {
        description: errorMessage,
      });
      return null;
    }
  };

  const updateProduct = async (productId: string, updates: Partial<Product>): Promise<Product | null> => {
    try {
      // Validar acesso
      const hasAccess = await securityService.validateResourceAccess('product', productId, 'UPDATE');
      if (!hasAccess) {
        toast.error('Acesso negado', {
          description: 'Você não tem permissão para editar este produto',
        });
        return null;
      }

      // Log da ação
      await securityService.logAction('UPDATE_PRODUCT', `product:${productId}`, updates);

      const data = await productService.updateProduct(productId, updates);
      
      // Atualizar lista local
      setProducts(prev => prev.map(p => p.id === productId ? data : p));
      
      toast.success('Produto atualizado', {
        description: `${data.name} foi atualizado com sucesso.`,
      });

      return data;
    } catch (err) {
      console.error('❌ useProducts: Erro ao atualizar produto:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar produto';
      toast.error('Erro ao atualizar produto', {
        description: errorMessage,
      });
      return null;
    }
  };

  const deleteProduct = async (productId: string): Promise<boolean> => {
    try {
      // Validar acesso
      const hasAccess = await securityService.validateResourceAccess('product', productId, 'DELETE');
      if (!hasAccess) {
        toast.error('Acesso negado', {
          description: 'Você não tem permissão para deletar este produto',
        });
        return false;
      }

      // Log da ação
      await securityService.logAction('DELETE_PRODUCT', `product:${productId}`);

      await productService.deleteProduct(productId);
      
      // Remover da lista local
      setProducts(prev => prev.filter(p => p.id !== productId));
      
      toast.success('Produto excluído', {
        description: 'O produto foi excluído com sucesso.',
      });

      return true;
    } catch (err) {
      console.error('❌ useProducts: Erro ao deletar produto:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar produto';
      toast.error('Erro ao deletar produto', {
        description: errorMessage,
      });
      return false;
    }
  };

  const duplicateProduct = async (productId: string): Promise<Product | null> => {
    try {
      // Validar acesso
      const hasAccess = await securityService.validateResourceAccess('product', productId, 'READ');
      if (!hasAccess) {
        toast.error('Acesso negado', {
          description: 'Você não tem permissão para duplicar este produto',
        });
        return null;
      }

      // Log da ação
      await securityService.logAction('DUPLICATE_PRODUCT', `product:${productId}`);

      const data = await productService.duplicateProduct(productId);
      
      // Adicionar à lista local
      setProducts(prev => [data, ...prev]);
      
      toast.success('Produto duplicado', {
        description: `${data.name} foi criado com sucesso.`,
      });

      return data;
    } catch (err) {
      console.error('❌ useProducts: Erro ao duplicar produto:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Erro ao duplicar produto';
      toast.error('Erro ao duplicar produto', {
        description: errorMessage,
      });
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
    createProduct,
    updateProduct,
    deleteProduct,
    duplicateProduct,
  };
};
