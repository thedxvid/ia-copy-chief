
import React, { useState } from 'react';
import { Plus, Search, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductModal } from '@/components/products/ProductModal';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/services/productService';

export default function Products() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNiche, setSelectedNiche] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { 
    products, 
    loading, 
    error,
    updateProduct,
    duplicateProduct,
    deleteProduct 
  } = useProducts();

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
    const result = await duplicateProduct(product.id);
    if (result) {
      console.log('✅ Produto duplicado com sucesso');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const success = await deleteProduct(productId);
    if (success) {
      console.log('✅ Produto deletado com sucesso');
    }
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    // O hook useProducts já atualiza a lista automaticamente
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6]"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">Erro ao carregar produtos</h3>
            <p className="text-[#888888] mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-[#3B82F6] hover:bg-[#2563EB] text-white">
              Tentar Novamente
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
        <div className="bg-[#1A1A1A] rounded-lg p-6 border border-[#2A2A2A]">
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
                <SelectContent className="bg-[#2A2A2A]">
                  <SelectItem value="all">Todos os nichos</SelectItem>
                  {uniqueNiches.map(niche => (
                    <SelectItem key={niche} value={niche}>{niche}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-48 bg-[#2A2A2A] border-[#4B5563] text-white">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent className="bg-[#2A2A2A]">
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
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
        <div className="flex items-center gap-4">
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

        {/* Product Modal */}
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          product={selectedProduct}
          onSuccess={handleModalSuccess}
        />
      </div>
    </DashboardLayout>
  );
}
