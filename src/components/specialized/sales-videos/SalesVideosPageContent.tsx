
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Video, Edit, Trash2, Copy, Package } from 'lucide-react';
import { useSpecializedCopies } from '@/hooks/useSpecializedCopies';
import { CreateVideoModal } from './CreateVideoModal';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export const SalesVideosPageContent = () => {
  const { copies, loading, deleteCopy, duplicateCopy, createCopy } = useSpecializedCopies('sales-videos');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const filteredCopies = copies.filter(copy =>
    copy.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateVideo = async (briefing: any) => {
    setIsCreating(true);
    try {
      const copyData = {
        copy_type: 'sales-videos' as const,
        title: `VSL - ${briefing.product_name}`,
        copy_data: briefing,
        status: 'draft' as const,
        product_id: briefing.product_id
      };

      await createCopy(copyData);
      setShowCreateModal(false);
      toast.success('Script VSL criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar vídeo:', error);
      toast.error('Erro ao criar vídeo');
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Carregando vídeos de venda...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Vídeos de Venda</h1>
          <p className="text-[#CCCCCC]">Crie scripts e roteiros para VSLs de alta conversão</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Criar Script VSL
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#CCCCCC] w-4 h-4" />
          <Input
            placeholder="Buscar scripts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#1E1E1E] border-[#4B5563] text-white"
          />
        </div>
        <Button variant="outline" className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A]">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </Button>
      </div>

      {filteredCopies.length === 0 ? (
        <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="w-12 h-12 text-[#4B5563] mb-4" />
            <h3 className="text-white text-lg font-medium mb-2">Nenhum script encontrado</h3>
            <p className="text-[#CCCCCC] text-center mb-4">
              {searchTerm ? 'Tente ajustar sua busca' : 'Comece criando seu primeiro script de VSL'}
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Script
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCopies.map((copy) => (
            <Card key={copy.id} className="bg-[#1E1E1E] border-[#4B5563]/20 hover:border-[#4B5563]/40 transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Video className="w-6 h-6 text-[#3B82F6]" />
                    <div>
                      <CardTitle className="text-white text-lg">{copy.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[#CCCCCC] text-sm">
                          {copy.copy_data?.duration ? `${copy.copy_data.duration} min` : 'Duração não definida'}
                        </p>
                        {(copy as any).products && (
                          <div className="flex items-center gap-1">
                            <Package className="w-3 h-3 text-[#3B82F6]" />
                            <span className="text-xs text-[#3B82F6]">
                              {(copy as any).products.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`${
                      copy.status === 'published' 
                        ? 'bg-green-500/20 text-green-500' 
                        : copy.status === 'draft'
                        ? 'bg-yellow-500/20 text-yellow-500'
                        : 'bg-gray-500/20 text-gray-500'
                    }`}
                  >
                    {copy.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-[#CCCCCC] text-sm line-clamp-3">
                  {copy.copy_data?.hook || copy.copy_data?.script?.substring(0, 150) || 'Sem conteúdo'}...
                </div>
                
                <div className="flex items-center justify-between text-xs text-[#CCCCCC]">
                  <span>Criado: {new Date(copy.created_at).toLocaleDateString('pt-BR')}</span>
                  {copy.copy_data?.script && (
                    <span>{Math.ceil(copy.copy_data.script.length / 1000)}k caracteres</span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" className="flex-1 border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A]">
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => duplicateCopy(copy)}
                    className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A]"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => deleteCopy(copy.id)}
                    className="border-red-500/20 text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateVideoModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateVideo}
        isLoading={isCreating}
      />
    </div>
  );
};
