
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter, Grid, List } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductModal } from '@/components/products/ProductModal';
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

export default function Products() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNiche, setSelectedNiche] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ['products', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!user,
  });

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.niche.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNiche = selectedNiche === 'all' || product.niche === selectedNiche;
    const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus;
    
    return matchesSearch && matchesNiche && matchesStatus;
  });

  const uniqueNiches = [...new Set(products.map(p => p.niche))];

  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleDuplicateProduct = async (product: Product) => {
    try {
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert({
          user_id: user?.id,
          name: `${product.name} (Cópia)`,
          niche: product.niche,
          sub_niche: product.sub_niche,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Produto duplicado",
        description: "O produto foi duplicado com sucesso.",
      });

      refetch();
    } catch (error) {
      console.error('Error duplicating product:', error);
      toast({
        title: "Erro",
        description: "Não foi possível duplicar o produto.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Produto excluído",
        description: "O produto foi excluído com sucesso.",
      });

      refetch();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o produto.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white font-['Inter'] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Produtos & Ofertas</h1>
            <p className="text-[#888888]">Gerencie suas ofertas de marketing digital</p>
          </div>
          <Button
            onClick={handleCreateProduct}
            className="bg-[#3B82F6] hover:bg-[#2563EB] text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Produto
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="bg-[#1A1A1A] rounded-lg p-6 mb-6 border border-[#2A2A2A]">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#888888] w-4 h-4" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#2A2A2A] border-[#4B5563] text-white placeholder:text-[#888888]"
                />
              </div>
              
              <Select value={selectedNiche} onValueChange={setSelectedNiche}>
                <SelectTrigger className="w-full sm:w-48 bg-[#2A2A2A] border-[#4B5563] text-white">
                  <SelectValue placeholder="Filtrar por nicho" />
                </SelectTrigger>
                <SelectContent className="bg-[#2A2A2A] border-[#4B5563]">
                  <SelectItem value="all" className="text-white hover:bg-[#3A3A3A]">Todos os nichos</SelectItem>
                  {uniqueNiches.map(niche => (
                    <SelectItem key={niche} value={niche} className="text-white hover:bg-[#3A3A3A]">{niche}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-48 bg-[#2A2A2A] border-[#4B5563] text-white">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent className="bg-[#2A2A2A] border-[#4B5563]">
                  <SelectItem value="all" className="text-white hover:bg-[#3A3A3A]">Todos os status</SelectItem>
                  <SelectItem value="draft" className="text-white hover:bg-[#3A3A3A]">Rascunho</SelectItem>
                  <SelectItem value="active" className="text-white hover:bg-[#3A3A3A]">Ativo</SelectItem>
                  <SelectItem value="paused" className="text-white hover:bg-[#3A3A3A]">Pausado</SelectItem>
                  <SelectItem value="archived" className="text-white hover:bg-[#3A3A3A]">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' 
                  ? "bg-[#3B82F6] hover:bg-[#2563EB] text-white" 
                  : "bg-[#2A2A2A] border-[#4B5563] text-white hover:bg-[#3A3A3A]"
                }
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' 
                  ? "bg-[#3B82F6] hover:bg-[#2563EB] text-white" 
                  : "bg-[#2A2A2A] border-[#4B5563] text-white hover:bg-[#3A3A3A]"
                }
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-[#888888]">
            {filteredProducts.length} de {products.length} produtos
          </span>
          {(searchTerm || selectedNiche !== 'all' || selectedStatus !== 'all') && (
            <div className="flex gap-2">
              {searchTerm && (
                <Badge variant="secondary" className="bg-[#2A2A2A] text-[#888888] border-[#4B5563]">
                  Busca: "{searchTerm}"
                </Badge>
              )}
              {selectedNiche !== 'all' && (
                <Badge variant="secondary" className="bg-[#2A2A2A] text-[#888888] border-[#4B5563]">
                  Nicho: {selectedNiche}
                </Badge>
              )}
              {selectedStatus !== 'all' && (
                <Badge variant="secondary" className="bg-[#2A2A2A] text-[#888888] border-[#4B5563]">
                  Status: {selectedStatus}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Products Grid/List */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-[#2A2A2A] rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-[#888888]" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {products.length === 0 ? 'Nenhum produto encontrado' : 'Nenhum resultado'}
            </h3>
            <p className="text-[#888888] mb-6">
              {products.length === 0 
                ? 'Comece criando seu primeiro produto digital'
                : 'Tente ajustar os filtros ou criar um novo produto'
              }
            </p>
            <Button
              onClick={handleCreateProduct}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              Criar Primeiro Produto
            </Button>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                viewMode={viewMode}
                onEdit={() => handleEditProduct(product)}
                onDuplicate={() => handleDuplicateProduct(product)}
                onDelete={() => handleDeleteProduct(product.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
        onSuccess={() => {
          refetch();
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
