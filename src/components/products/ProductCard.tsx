
import React from 'react';
import { Calendar, Copy, Edit, MoreVertical, Trash2, Target, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Product {
  id: string;
  name: string;
  niche: string;
  sub_niche: string | null;
  status: 'draft' | 'active' | 'paused' | 'archived';
  created_at: string;
  updated_at: string;
}

interface ProductCardProps {
  product: Product;
  viewMode: 'grid' | 'list';
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  viewMode,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'draft':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'paused':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'archived':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'draft':
        return 'Rascunho';
      case 'paused':
        return 'Pausado';
      case 'archived':
        return 'Arquivado';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (viewMode === 'list') {
    return (
      <Card className="bg-[#1A1A1A] border-[#2A2A2A] hover:border-[#3B82F6]/30 transition-all duration-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 bg-[#3B82F6]/20 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-[#3B82F6]" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">{product.name}</h3>
                <div className="flex items-center gap-4 text-sm text-[#888888]">
                  <span>{product.niche}</span>
                  {product.sub_niche && (
                    <>
                      <span>•</span>
                      <span>{product.sub_niche}</span>
                    </>
                  )}
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(product.updated_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(product.status)}>
                {getStatusLabel(product.status)}
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-[#888888] hover:text-white">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#2A2A2A] border-[#4B5563]">
                  <DropdownMenuItem onClick={onEdit} className="text-white hover:bg-[#3A3A3A]">
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDuplicate} className="text-white hover:bg-[#3A3A3A]">
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#4B5563]" />
                  <DropdownMenuItem onClick={onDelete} className="text-red-400 hover:bg-red-500/20">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#1A1A1A] border-[#2A2A2A] hover:border-[#3B82F6]/30 transition-all duration-200 group">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 bg-[#3B82F6]/20 rounded-lg flex items-center justify-center">
            <Target className="w-6 h-6 text-[#3B82F6]" />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-[#888888] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#2A2A2A] border-[#4B5563]">
              <DropdownMenuItem onClick={onEdit} className="text-white hover:bg-[#3A3A3A]">
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate} className="text-white hover:bg-[#3A3A3A]">
                <Copy className="w-4 h-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#4B5563]" />
              <DropdownMenuItem onClick={onDelete} className="text-red-400 hover:bg-red-500/20">
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <h3 className="text-lg font-semibold text-white mb-2 cursor-pointer hover:text-[#3B82F6] transition-colors" onClick={onEdit}>
          {product.name}
        </h3>
        
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#888888]">Nicho:</span>
            <span className="text-sm text-white">{product.niche}</span>
          </div>
          
          {product.sub_niche && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#888888]">Sub-nicho:</span>
              <span className="text-sm text-white">{product.sub_niche}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Badge className={getStatusColor(product.status)}>
            {getStatusLabel(product.status)}
          </Badge>
          
          <span className="text-xs text-[#888888] flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(product.updated_at)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
