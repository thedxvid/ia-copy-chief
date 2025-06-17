
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, FileText, Edit, Trash2, Copy } from 'lucide-react';
import { useSpecializedCopies } from '@/hooks/useSpecializedCopies';
import { CreatePageModal } from './CreatePageModal';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export const PagesPageContent = () => {
  const { copies, loading, deleteCopy, duplicateCopy, createCopy } = useSpecializedCopies('pages');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const filteredCopies = copies.filter(copy =>
    copy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    copy.copy_data?.page_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreatePage = async (briefing: any) => {
    setIsCreating(true);
    try {
      const copyData = {
        copy_type: 'pages' as const,
        title: `${briefing.page_type} - ${briefing.product_name}`,
        copy_data: briefing,
        status: 'draft' as const
      };

      await createCopy(copyData);
      setShowCreateModal(false);
      toast.success('Página criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar página:', error);
      toast.error('Erro ao criar página');
    } finally {
      setIsCreating(false);
    }
  };

  const getPageTypeIcon = (pageType: string) => {
    switch (pageType) {
      case 'landing':
        return '🎯';
      case 'sales':
        return '💰';
      case 'squeeze':
        return '📧';
      case 'thank-you':
        return '🙏';
      default:
        return '📄';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'published': { color: 'bg-green-500/20 text-green-500', label: 'Publicado' },
      'draft': { color: 'bg-yellow-500/20 text-yellow-500', label: 'Rascunho' },
      'archived': { color: 'bg-gray-500/20 text-gray-500', label: 'Arquivado' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.draft;
    
    return (
      <Badge variant="secondary" className={`${statusInfo.color} text-xs`}>
        {statusInfo.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Carregando páginas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Páginas</h1>
          <p className="text-[#CCCCCC]">Crie copies para landing pages, sales pages e squeeze pages</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Criar Página
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#CCCCCC] w-4 h-4" />
          <Input
            placeholder="Buscar páginas..."
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
            <FileText className="w-12 h-12 text-[#4B5563] mb-4" />
            <h3 className="text-white text-lg font-medium mb-2">Nenhuma página encontrada</h3>
            <p className="text-[#CCCCCC] text-center mb-4">
              {searchTerm ? 'Tente ajustar sua busca' : 'Comece criando sua primeira página'}
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Página
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCopies.map((copy) => (
            <Card key={copy.id} className="bg-[#1E1E1E] border-[#4B5563]/20 hover:border-[#4B5563]/40 transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2 flex-1">
                    <span className="text-2xl">{getPageTypeIcon(copy.copy_data?.page_type || '')}</span>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-white text-lg truncate">{copy.title}</CardTitle>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[#CCCCCC] text-sm">{copy.copy_data?.page_type || 'Página'}</p>
                        {getStatusBadge(copy.status)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-[#CCCCCC] text-sm line-clamp-3">
                  {copy.copy_data?.headline || copy.copy_data?.content || 'Sem conteúdo'}
                </div>
                
                <div className="flex items-center justify-between text-xs text-[#CCCCCC]">
                  <span>Criado: {new Date(copy.created_at).toLocaleDateString('pt-BR')}</span>
                  {copy.tags && copy.tags.length > 0 && (
                    <span>{copy.tags.length} tag(s)</span>
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

      <CreatePageModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreatePage}
        isLoading={isCreating}
      />
    </div>
  );
};
