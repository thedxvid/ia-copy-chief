
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { QuizTemplate, QuizQuestion, useQuizTemplates, getQuestionsLength } from '@/hooks/useQuizTemplates';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface QuizTemplateManagerProps {
  onSelectTemplate?: (template: QuizTemplate) => void;
}

export const QuizTemplateManager: React.FC<QuizTemplateManagerProps> = ({ onSelectTemplate }) => {
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate } = useQuizTemplates();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuizTemplate | null>(null);
  const [formData, setFormData] = useState({
    quiz_type: '',
    title: '',
    description: '',
    questions: [] as QuizQuestion[]
  });

  const quizTypes = [
    { value: 'vsl', label: 'VSL' },
    { value: 'product', label: 'Produto' },
    { value: 'landing', label: 'Landing Page' },
    { value: 'ads', label: 'Anúncios' }
  ];

  const resetForm = () => {
    setFormData({
      quiz_type: '',
      title: '',
      description: '',
      questions: []
    });
    setEditingTemplate(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (template: QuizTemplate) => {
    setEditingTemplate(template);
    setFormData({
      quiz_type: template.quiz_type,
      title: template.title,
      description: template.description || '',
      questions: Array.isArray(template.questions) ? template.questions as unknown as QuizQuestion[] : []
    });
    setIsDialogOpen(true);
  };

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `question_${Date.now()}`,
      question: '',
      type: 'textarea',
      required: true
    };
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!formData.quiz_type || !formData.title || formData.questions.length === 0) {
      toast.error('Preencha todos os campos obrigatórios e adicione pelo menos uma pergunta');
      return;
    }

    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, {
          ...formData,
          version: editingTemplate.version + 1
        });
        toast.success('Template atualizado!');
      } else {
        await createTemplate({
          ...formData,
          is_default: false,
          is_active: true,
          version: 1
        });
        toast.success('Template criado!');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleDelete = async (templateId: string) => {
    try {
      await deleteTemplate(templateId);
      toast.success('Template excluído!');
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

  const userTemplates = templates.filter(t => t.created_by);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Meus Templates</h3>
          <p className="text-sm text-[#CCCCCC]">Gerencie seus templates personalizados</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} size="sm" className="bg-[#3B82F6] hover:bg-[#2563EB]">
              <Plus className="w-4 h-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1E1E1E] border-[#4B5563] max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingTemplate ? 'Editar Template' : 'Novo Template'}
              </DialogTitle>
              <DialogDescription>
                Crie um template personalizado para seus quiz
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Tipo</Label>
                  <Select value={formData.quiz_type} onValueChange={(value) => setFormData(prev => ({...prev, quiz_type: value}))}>
                    <SelectTrigger className="bg-[#2A2A2A] border-[#4B5563] text-white">
                      <SelectValue placeholder="Selecione o tipo" />
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
                
                <div>
                  <Label className="text-white">Título</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
                    className="bg-[#2A2A2A] border-[#4B5563] text-white"
                    placeholder="Nome do template"
                  />
                </div>
              </div>

              <div>
                <Label className="text-white">Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                  className="bg-[#2A2A2A] border-[#4B5563] text-white"
                  placeholder="Descreva o objetivo deste template..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-white">Perguntas</Label>
                  <Button onClick={addQuestion} size="sm" variant="outline" className="border-[#4B5563] text-white hover:bg-[#2A2A2A]">
                    <Plus className="w-3 h-3 mr-1" />
                    Pergunta
                  </Button>
                </div>
                
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {formData.questions.map((question, index) => (
                    <div key={question.id} className="bg-[#2A2A2A] p-3 rounded border border-[#4B5563]/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-[#CCCCCC]">Pergunta {index + 1}</span>
                        <Button
                          onClick={() => removeQuestion(index)}
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <Input
                        value={question.question}
                        onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                        className="bg-[#1A1A1A] border-[#4B5563] text-white text-sm"
                        placeholder="Digite a pergunta..."
                      />
                    </div>
                  ))}
                  
                  {formData.questions.length === 0 && (
                    <div className="text-center py-4 text-[#888888] text-sm">
                      Nenhuma pergunta adicionada. Clique em "Pergunta" para adicionar.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} className="bg-[#3B82F6] hover:bg-[#2563EB] flex-1">
                  {editingTemplate ? 'Atualizar' : 'Criar'} Template
                </Button>
                <Button 
                  onClick={() => setIsDialogOpen(false)} 
                  variant="outline" 
                  className="border-[#4B5563] text-white hover:bg-[#2A2A2A]"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-4 text-[#CCCCCC]">
          Carregando templates...
        </div>
      ) : userTemplates.length === 0 ? (
        <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
          <CardContent className="pt-6 text-center py-8">
            <Settings className="w-12 h-12 text-[#888888] mx-auto mb-4" />
            <div className="text-[#888888] mb-4">
              Você ainda não criou nenhum template personalizado
            </div>
            <Button onClick={openCreateDialog} className="bg-[#3B82F6] hover:bg-[#2563EB]">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userTemplates.map((template) => (
            <Card key={template.id} className="bg-[#1E1E1E] border-[#4B5563]/20 hover:border-[#3B82F6]/30 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-[#3B82F6] border-[#3B82F6]/50">
                        {getTypeLabel(template.quiz_type)}
                      </Badge>
                    </div>
                    <CardTitle className="text-white text-lg">{template.title}</CardTitle>
                    {template.description && (
                      <CardDescription className="mt-1">
                        {template.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-[#CCCCCC]">
                    <span className="font-medium">{getQuestionsLength(template.questions)}</span> perguntas
                  </div>
                  
                  <div className="text-xs text-[#888888]">
                    Versão {template.version} • Atualizado em{' '}
                    {new Date(template.updated_at).toLocaleDateString('pt-BR')}
                  </div>

                  <div className="flex gap-2 pt-2">
                    {onSelectTemplate && (
                      <Button
                        size="sm"
                        onClick={() => onSelectTemplate(template)}
                        className="bg-[#3B82F6] hover:bg-[#2563EB] flex-1"
                      >
                        Usar Template
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(template)}
                      className="border-[#4B5563] text-white hover:bg-[#2A2A2A]"
                    >
                      <Edit className="w-3 h-3" />
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
