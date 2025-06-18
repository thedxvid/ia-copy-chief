
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { QuizTemplate, useQuizTemplates } from '@/hooks/useQuizTemplates';
import { QuizTemplateEditor } from './QuizTemplateEditor';
import { Plus, Edit, Copy, Trash2, Eye, Search, Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export const QuizTemplatesManager: React.FC = () => {
  const { templates, isLoading, deleteTemplate, duplicateTemplate } = useQuizTemplates();
  const [currentView, setCurrentView] = useState<'list' | 'edit'>('list');
  const [editingTemplate, setEditingTemplate] = useState<QuizTemplate | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const quizTypes = [
    { value: 'all', label: 'Todos os tipos' },
    { value: 'vsl', label: 'VSL' },
    { value: 'product', label: 'Produto' },
    { value: 'landing', label: 'Landing Page' },
    { value: 'ads', label: 'Anúncios' }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || template.quiz_type === filterType;
    return matchesSearch && matchesType;
  });

  const handleEdit = (template: QuizTemplate) => {
    setEditingTemplate(template);
    setCurrentView('edit');
  };

  const handleCreate = () => {
    setEditingTemplate(undefined);
    setCurrentView('edit');
  };

  const handleBack = () => {
    setCurrentView('list');
    setEditingTemplate(undefined);
  };

  const handleSave = (template: QuizTemplate) => {
    setCurrentView('list');
    setEditingTemplate(undefined);
    toast.success(editingTemplate ? 'Template atualizado!' : 'Template criado!');
  };

  const handleDuplicate = async (template: QuizTemplate) => {
    try {
      await duplicateTemplate(template.id, `${template.title} (Cópia)`);
    } catch (error) {
      console.error('Error duplicating template:', error);
    }
  };

  const handleDelete = async (templateId: string) => {
    try {
      await deleteTemplate(templateId);
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      vsl: 'VSL',
      product: 'Produto',
      landing: 'Landing Page',
      ads: 'Anúncios'
    };
    return typeMap[type] || type;
  };

  const getTypeBadgeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      vsl: 'bg-red-500/10 text-red-400 border-red-500/20',
      product: 'bg-green-500/10 text-green-400 border-green-500/20',
      landing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      ads: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    };
    return colorMap[type] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  };

  if (currentView === 'edit') {
    return (
      <QuizTemplateEditor
        template={editingTemplate}
        onBack={handleBack}
        onSave={handleSave}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Templates de Quiz</h1>
          <p className="text-[#CCCCCC]">Gerencie os templates de perguntas dos quiz</p>
        </div>
        <Button onClick={handleCreate} className="bg-[#3B82F6] hover:bg-[#2563EB]">
          <Plus className="w-4 h-4 mr-2" />
          Novo Template
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#888888]" />
                <Input
                  placeholder="Buscar templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-[#2A2A2A] border-[#4B5563] text-white pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="bg-[#2A2A2A] border-[#4B5563] text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {quizTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="text-[#CCCCCC]">Carregando templates...</div>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
          <CardContent className="pt-6 text-center py-8">
            <div className="text-[#888888] mb-4">
              {searchTerm || filterType !== 'all' 
                ? 'Nenhum template encontrado com os filtros aplicados'
                : 'Nenhum template criado ainda'
              }
            </div>
            {!searchTerm && filterType === 'all' && (
              <Button onClick={handleCreate} className="bg-[#3B82F6] hover:bg-[#2563EB]">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Template
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="bg-[#1E1E1E] border-[#4B5563]/20 hover:border-[#3B82F6]/30 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getTypeBadgeColor(template.quiz_type)}>
                        {getTypeLabel(template.quiz_type)}
                      </Badge>
                      {template.is_default && (
                        <Badge variant="outline" className="text-[#3B82F6] border-[#3B82F6]/50">
                          Padrão
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-white text-lg">{template.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {template.description || 'Sem descrição'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-[#CCCCCC]">
                    <span className="font-medium">{template.questions.length}</span> perguntas
                  </div>
                  
                  <div className="text-xs text-[#888888]">
                    Versão {template.version} • Atualizado em{' '}
                    {new Date(template.updated_at).toLocaleDateString('pt-BR')}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => handleEdit(template)}
                      className="bg-[#3B82F6] hover:bg-[#2563EB] flex-1"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDuplicate(template)}
                      className="border-[#4B5563] text-white hover:bg-[#2A2A2A]"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-[#1E1E1E] border-[#4B5563]">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white">
                            Excluir Template
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o template "{template.title}"? 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-[#2A2A2A] border-[#4B5563] text-white hover:bg-[#333333]">
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(template.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
