
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Megaphone, ExternalLink, Edit, Trash2, Copy, LayoutGrid, List, Eye } from 'lucide-react';
import { useSpecializedCopies } from '@/hooks/useSpecializedCopies';
import { CreateAdModal } from './CreateAdModal';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export const AdsPageContent = () => {
  const { copies, loading, deleteCopy, duplicateCopy, createCopy } = useSpecializedCopies('ads');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewCopy, setPreviewCopy] = useState<any>(null);

  const filteredCopies = copies.filter(copy =>
    copy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    copy.platform?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateAd = async (briefing: any, generatedCopy?: any) => {
    setIsCreating(true);
    try {
      const copyData = {
        copy_type: 'ads' as const,
        title: `Anúncio - ${briefing.product_name}`,
        copy_data: {
          briefing,
          generated_copy: generatedCopy,
          headline: generatedCopy?.headline || '',
          content: generatedCopy?.content || '',
          cta: generatedCopy?.cta || '',
          variations: generatedCopy?.variations || []
        },
        status: 'draft' as const,
        platform: briefing.platform,
        product_id: briefing.product_id
      };

      await createCopy(copyData);
      setShowCreateModal(false);
      toast.success('Anúncio criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar anúncio:', error);
      toast.error('Erro ao criar anúncio');
    } finally {
      setIsCreating(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return '📘';
      case 'google':
        return '🔍';
      case 'instagram':
        return '📷';
      case 'linkedin':
        return '💼';
      default:
        return '📢';
    }
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredCopies.map((copy) => (
        <Card key={copy.id} className="bg-[#1E1E1E] border-[#4B5563]/20 hover:border-[#4B5563]/40 transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{getPlatformIcon(copy.platform || '')}</span>
                <div>
                  <CardTitle className="text-white text-lg truncate">{copy.title}</CardTitle>
                  <p className="text-[#CCCCCC] text-sm">{copy.platform || 'Geral'}</p>
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
              {copy.copy_data?.generated_copy?.headline || copy.copy_data?.headline || 'Copy gerada'}
            </div>
            
            <div className="flex items-center justify-between text-xs text-[#CCCCCC]">
              <span>Criado: {new Date(copy.created_at).toLocaleDateString('pt-BR')}</span>
              {copy.tags && copy.tags.length > 0 && (
                <span>{copy.tags.length} tag(s)</span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setPreviewCopy(copy)}
                className="flex-1 border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A]"
              >
                <Eye className="w-4 h-4 mr-1" />
                Ver
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
  );

  const renderListView = () => (
    <div className="space-y-4">
      {filteredCopies.map((copy) => (
        <Card key={copy.id} className="bg-[#1E1E1E] border-[#4B5563]/20 hover:border-[#4B5563]/40 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <span className="text-2xl">{getPlatformIcon(copy.platform || '')}</span>
                <div className="flex-1">
                  <h3 className="text-white font-medium">{copy.title}</h3>
                  <p className="text-[#CCCCCC] text-sm mt-1">
                    {copy.copy_data?.generated_copy?.headline || copy.copy_data?.headline || 'Copy gerada'}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-[#CCCCCC]">
                    <span>{copy.platform || 'Geral'}</span>
                    <span>•</span>
                    <span>{new Date(copy.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
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
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setPreviewCopy(copy)}
                  className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A]"
                >
                  <Eye className="w-4 h-4" />
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
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Carregando anúncios...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Anúncios</h1>
          <p className="text-[#CCCCCC]">Gerencie suas copies de anúncios para diferentes plataformas</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Criar Anúncio
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#CCCCCC] w-4 h-4" />
          <Input
            placeholder="Buscar anúncios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#1E1E1E] border-[#4B5563] text-white"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('grid')}
            className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A]"
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('list')}
            className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A]"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
        <Button variant="outline" className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A]">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </Button>
      </div>

      {filteredCopies.length === 0 ? (
        <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Megaphone className="w-12 h-12 text-[#4B5563] mb-4" />
            <h3 className="text-white text-lg font-medium mb-2">Nenhum anúncio encontrado</h3>
            <p className="text-[#CCCCCC] text-center mb-4">
              {searchTerm ? 'Tente ajustar sua busca' : 'Comece criando seu primeiro anúncio'}
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Anúncio
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        viewMode === 'grid' ? renderGridView() : renderListView()
      )}

      <CreateAdModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateAd}
        isLoading={isCreating}
      />

      {/* Preview Modal */}
      <Dialog open={!!previewCopy} onOpenChange={() => setPreviewCopy(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1E1E1E] border-[#4B5563]/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">
              {previewCopy?.title}
            </DialogTitle>
          </DialogHeader>
          
          {previewCopy && (
            <div className="space-y-6">
              {previewCopy.copy_data?.generated_copy?.headline && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Headline</h3>
                  <div className="bg-[#2A2A2A] p-4 rounded-lg">
                    <p className="text-[#CCCCCC]">{previewCopy.copy_data.generated_copy.headline}</p>
                  </div>
                </div>
              )}
              
              {previewCopy.copy_data?.generated_copy?.content && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Conteúdo</h3>
                  <div className="bg-[#2A2A2A] p-4 rounded-lg">
                    <p className="text-[#CCCCCC] whitespace-pre-wrap">{previewCopy.copy_data.generated_copy.content}</p>
                  </div>
                </div>
              )}
              
              {previewCopy.copy_data?.generated_copy?.cta && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Call to Action</h3>
                  <div className="bg-[#2A2A2A] p-4 rounded-lg">
                    <p className="text-[#CCCCCC]">{previewCopy.copy_data.generated_copy.cta}</p>
                  </div>
                </div>
              )}
              
              {previewCopy.copy_data?.generated_copy?.variations && previewCopy.copy_data.generated_copy.variations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Variações</h3>
                  <div className="space-y-3">
                    {previewCopy.copy_data.generated_copy.variations.map((variation: string, index: number) => (
                      <div key={index} className="bg-[#2A2A2A] p-4 rounded-lg">
                        <p className="text-xs text-[#CCCCCC] mb-2">Variação {index + 1}</p>
                        <p className="text-[#CCCCCC]">{variation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {previewCopy.copy_data?.generated_copy?.fullContent && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Copy Completa</h3>
                  <Textarea
                    value={previewCopy.copy_data.generated_copy.fullContent}
                    readOnly
                    className="min-h-48 bg-[#2A2A2A] border-[#4B5563] text-white"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
