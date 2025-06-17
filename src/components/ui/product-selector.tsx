
import React, { useState, useEffect } from 'react';
import { useProducts, type Product, type ProductDetails } from '@/hooks/useProducts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  const { products, loading, fetchProductDetails } = useProducts();
  const [selectedProductDetails, setSelectedProductDetails] = useState<ProductDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (value && showPreview) {
      setLoadingDetails(true);
      fetchProductDetails(value).then((details) => {
        setSelectedProductDetails(details);
        setLoadingDetails(false);
      });
    } else {
      setSelectedProductDetails(null);
    }
  }, [value, showPreview, fetchProductDetails]);

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
          <SelectTrigger className="bg-[#2A2A2A] border-[#4B5563] text-white">
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
        <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
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
          
          {selectedProductDetails && (
            <CardContent className="pt-0">
              <Collapsible open={showDetails} onOpenChange={setShowDetails}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between text-[#CCCCCC] hover:text-white">
                    {showDetails ? 'Ocultar detalhes' : 'Ver detalhes do contexto'}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 mt-3">
                  {selectedProductDetails.strategy?.value_proposition && (
                    <div>
                      <h4 className="text-xs font-medium text-[#CCCCCC] mb-1">Proposta de Valor:</h4>
                      <p className="text-xs text-white">{selectedProductDetails.strategy.value_proposition}</p>
                    </div>
                  )}
                  
                  {selectedProductDetails.strategy?.target_audience && (
                    <div>
                      <h4 className="text-xs font-medium text-[#CCCCCC] mb-1">Público-Alvo:</h4>
                      <p className="text-xs text-white">
                        {typeof selectedProductDetails.strategy.target_audience === 'string' 
                          ? selectedProductDetails.strategy.target_audience 
                          : JSON.stringify(selectedProductDetails.strategy.target_audience)}
                      </p>
                    </div>
                  )}
                  
                  {selectedProductDetails.meta?.tags && selectedProductDetails.meta.tags.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-[#CCCCCC] mb-1">Tags:</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedProductDetails.meta.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          )}
          
          {loadingDetails && (
            <CardContent className="pt-0">
              <div className="text-xs text-[#CCCCCC]">Carregando detalhes...</div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};
