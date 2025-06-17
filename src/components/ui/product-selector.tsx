
import React from 'react';
import { useProducts, type Product } from '@/hooks/useProducts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProductSelectorProps {
  value?: string;
  onValueChange: (productId: string | undefined) => void;
  placeholder?: string;
  showPreview?: boolean;
  className?: string;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  value,
  onValueChange,
  placeholder = "Selecione um produto para contexto",
  showPreview = true,
  className
}) => {
  const { products, loading } = useProducts();

  const handleValueChange = (newValue: string) => {
    if (newValue === 'none') {
      onValueChange(undefined);
    } else {
      onValueChange(newValue);
    }
  };

  const selectedProduct = products.find(p => p.id === value);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-[#3B82F6]" />
          <label className="text-sm font-medium text-white">
            Produto para Contexto IA
          </label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3 h-3 text-[#CCCCCC] cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Selecione um produto para que a IA use suas informações como contexto</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <Select value={value || 'none'} onValueChange={handleValueChange} disabled={loading}>
          <SelectTrigger className="bg-[#2A2A2A] border-[#4B5563] text-white rounded-2xl">
            <SelectValue placeholder={loading ? "Carregando produtos..." : placeholder} />
          </SelectTrigger>
          <SelectContent className="bg-[#2A2A2A] border-[#4B5563] text-white">
            <SelectItem value="none">Sem produto específico</SelectItem>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                <div className="flex items-center gap-2">
                  <span>{product.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {product.niche}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedProduct && showPreview && (
        <Card className="bg-[#1E1E1E] border-[#4B5563]/20 rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-sm">{selectedProduct.name}</CardTitle>
                <CardDescription>
                  {selectedProduct.niche} {selectedProduct.sub_niche && `• ${selectedProduct.sub_niche}`}
                </CardDescription>
              </div>
              <Badge variant={selectedProduct.status === 'published' ? 'default' : 'secondary'}>
                {selectedProduct.status}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#3B82F6]"></div>
                <span className="text-[#3B82F6] text-sm font-medium">
                  Contexto ativo - A IA usará as informações deste produto
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
