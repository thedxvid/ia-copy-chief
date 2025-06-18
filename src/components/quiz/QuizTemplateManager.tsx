
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
import { Switch } from '@/components/ui/switch';
import { QuizTemplate, QuizQuestion, useQuizTemplates, getQuestionsLength } from '@/hooks/useQuizTemplates';
import { Plus, Edit, Trash2, Settings, Copy, Move, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

interface QuizTemplateManagerProps {
  onSelectTemplate?: (template: QuizTemplate) => void;
}

export const QuizTemplateManager: React.FC<QuizTemplateManagerProps> = ({ onSelectTemplate }) => {
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate, duplicateTemplate } = useQuizTemplates();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuizTemplate | null>(null);
  const [formData, setFormData] = useState({
    quiz_type: '',
    title: '',
    description: '',
    questions: [] as QuizQuestion[]
  });

  const quizTypes = [
    { value: 'vsl', label: 'VSL (Video Sales Letter)' },
    { value: 'product', label: 'Produto/Serviço' },
    { value: 'landing', label: 'Landing Page' },
    { value: 'ads', label: 'Anúncios Pagos' },
    { value: 'email', label: 'E-mail Marketing' },
    { value: 'social', label: 'Redes Sociais' },
    { value: 'blog', label: 'Blog/Artigo' },
    { value: 'custom', label: 'Personalizado' }
  ];

  const questionTypes = [
    { value: 'text', label: 'Texto Curto' },
    { value: 'textarea', label: 'Texto Longo' },
    { value: 'number', label: 'Número' },
    { value: 'select', label: 'Seleção Única' },
    { value: 'radio', label: 'Múltipla Escolha' }
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
      required: true,
      placeholder: '',
      helpText: ''
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

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formData.questions.length) return;

    setFormData(prev => {
      const newQuestions = [...prev.questions];
      [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
      return { ...prev, questions: newQuestions };
    });
  };

  const addOption = (questionIndex: number) => {
    updateQuestion(questionIndex, 'options', [
      ...(formData.questions[questionIndex].options || []),
      ''
    ]);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const currentOptions = formData.questions[questionIndex].options || [];
    const newOptions = [...currentOptions];
    newOptions[optionIndex] = value;
    updateQuestion(questionIndex, 'options', newOptions);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const currentOptions = formData.questions[questionIndex].options || [];
    const newOptions = currentOptions.filter((_, i) => i !== optionIndex);
    updateQuestion(questionIndex, 'options', newOptions);
  };

  const handleSave = async () => {
    if (!formData.quiz_type || !formData.title || formData.questions.length === 0) {
      toast.error('Preencha todos os campos obrigatórios e adicione pelo menos uma pergunta');
      return;
    }

    // Validar perguntas
    for (let i = 0; i < formData.questions.length; i++) {
      const question = formData.questions[i];
      if (!question.question.trim()) {
        toast.error(`Pergunta ${i + 1} não pode estar vazia`);
        return;
      }
      if ((question.type === 'select' || question.type === 'radio') && (!question.options || question.options.length < 2)) {
        toast.error(`Pergunta ${i + 1} deve ter pelo menos 2 opções`);
        return;
      }
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

  const handleDuplicate = async (template: QuizTemplate) => {
    try {
      await duplicateTemplate(template.id, `${template.title} (Cópia)`);
      toast.success('Template duplicado!');
    } catch (error) {
      console.error('Error duplicating template:', error);
    }
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      vsl: 'VSL',
      product: 'Produto',
      landing: 'Landing Page',
      ads: 'Anúncios',
      email: 'E-mail',
      social: 'Social',
      blog: 'Blog',
      custom: 'Personalizado'
    };
    return typeMap[type] || type;
  };

  const userTemplates = templates.filter(t => t.created_by);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Meus Templates</h3>
          <p className="text-sm text-[#CCCCCC]">Crie e gerencie templates personalizados com perguntas avançadas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} size="sm" className="bg-[#3B82F6] hover:bg-[#2563EB]">
              <Plus className="w-4 h-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1E1E1E] border-[#4B5563] max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingTemplate ? 'Editar Template' : 'Novo Template'}
              </DialogTitle>
              <DialogDescription>
                Crie um template personalizado com perguntas avançadas para seus quiz
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Tipo de Copy</Label>
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
                  <Label className="text-white">Nome do Template</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
                    className="bg-[#2A2A2A] border-[#4B5563] text-white"
                    placeholder="Ex: Quiz VSL Avançado"
                  />
                </div>
              </div>

              <div>
                <Label className="text-white">Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                  className="bg-[#2A2A2A] border-[#4B5563] text-white"
                  placeholder="Descreva o objetivo e uso deste template..."
                  rows={2}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-white text-lg">Perguntas do Quiz</Label>
                  <Button onClick={addQuestion} size="sm" variant="outline" className="border-[#4B5563] text-white hover:bg-[#2A2A2A]">
                    <Plus className="w-3 h-3 mr-2" />
                    Adicionar Pergunta
                  </Button>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {formData.questions.map((question, index) => (
                    <div key={question.id} className="bg-[#2A2A2A] p-4 rounded-lg border border-[#4B5563]/20">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-[#CCCCCC]">Pergunta {index + 1}</span>
                        <div className="flex gap-1">
                          <Button
                            onClick={() => moveQuestion(index, 'up')}
                            size="sm"
                            variant="ghost"
                            disabled={index === 0}
                            className="text-[#CCCCCC] hover:text-white"
                          >
                            <Move className="w-3 h-3" />
                          </Button>
                          <Button
                            onClick={() => removeQuestion(index)}
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <Label className="text-xs text-[#CCCCCC]">Pergunta</Label>
                          <Input
                            value={question.question}
                            onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                            className="bg-[#1A1A1A] border-[#4B5563] text-white text-sm"
                            placeholder="Digite a pergunta..."
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-[#CCCCCC]">Tipo</Label>
                          <Select 
                            value={question.type} 
                            onValueChange={(value) => updateQuestion(index, 'type', value)}
                          >
                            <SelectTrigger className="bg-[#1A1A1A] border-[#4B5563] text-white text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {questionTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <Label className="text-xs text-[#CCCCCC]">Placeholder</Label>
                          <Input
                            value={question.placeholder || ''}
                            onChange={(e) => updateQuestion(index, 'placeholder', e.target.value)}
                            className="bg-[#1A1A1A] border-[#4B5563] text-white text-sm"
                            placeholder="Texto de ajuda..."
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-[#CCCCCC]">Texto de Ajuda</Label>
                          <Input
                            value={question.helpText || ''}
                            onChange={(e) => updateQuestion(index, 'helpText', e.target.value)}
                            className="bg-[#1A1A1A] border-[#4B5563] text-white text-sm"
                            placeholder="Dica adicional..."
                          />
                        </div>
                      </div>

                      {(question.type === 'text' || question.type === 'textarea') && (
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <Label className="text-xs text-[#CCCCCC]">Min. Caracteres</Label>
                            <Input
                              type="number"
                              value={question.min || ''}
                              onChange={(e) => updateQuestion(index, 'min', parseInt(e.target.value) || undefined)}
                              className="bg-[#1A1A1A] border-[#4B5563] text-white text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-[#CCCCCC]">Máx. Caracteres</Label>
                            <Input
                              type="number"
                              value={question.maxLength || ''}
                              onChange={(e) => updateQuestion(index, 'maxLength', parseInt(e.target.value) || undefined)}
                              className="bg-[#1A1A1A] border-[#4B5563] text-white text-sm"
                            />
                          </div>
                        </div>
                      )}

                      {question.type === 'number' && (
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <Label className="text-xs text-[#CCCCCC]">Valor Mínimo</Label>
                            <Input
                              type="number"
                              value={question.min || ''}
                              onChange={(e) => updateQuestion(index, 'min', parseInt(e.target.value) || undefined)}
                              className="bg-[#1A1A1A] border-[#4B5563] text-white text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-[#CCCCCC]">Valor Máximo</Label>
                            <Input
                              type="number"
                              value={question.max || ''}
                              onChange={(e) => updateQuestion(index, 'max', parseInt(e.target.value) || undefined)}
                              className="bg-[#1A1A1A] border-[#4B5563] text-white text-sm"
                            />
                          </div>
                        </div>
                      )}

                      {(question.type === 'select' || question.type === 'radio') && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-xs text-[#CCCCCC]">Opções</Label>
                            <Button
                              onClick={() => addOption(index)}
                              size="sm"
                              variant="outline"
                              className="border-[#4B5563] text-white hover:bg-[#1A1A1A] text-xs h-6"
                            >
                              <Plus className="w-2 h-2 mr-1" />
                              Opção
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {(question.options || []).map((option, optionIndex) => (
                              <div key={optionIndex} className="flex gap-2">
                                <Input
                                  value={option}
                                  onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                                  className="bg-[#1A1A1A] border-[#4B5563] text-white text-sm"
                                  placeholder={`Opção ${optionIndex + 1}`}
                                />
                                <Button
                                  onClick={() => removeOption(index, optionIndex)}
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={question.required}
                          onCheckedChange={(checked) => updateQuestion(index, 'required', checked)}
                        />
                        <Label className="text-xs text-[#CCCCCC]">Pergunta obrigatória</Label>
                      </div>
                    </div>
                  ))}
                  
                  {formData.questions.length === 0 && (
                    <div className="text-center py-8 text-[#888888]">
                      <HelpCircle className="w-12 h-12 mx-auto mb-3 text-[#555555]" />
                      <p className="text-sm">Nenhuma pergunta adicionada ainda.</p>
                      <p className="text-xs text-[#666666] mt-1">
                        Clique em "Adicionar Pergunta" para começar.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-[#4B5563]/20">
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
        <div className="text-center py-8 text-[#CCCCCC]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B82F6] mx-auto mb-4"></div>
          Carregando templates...
        </div>
      ) : userTemplates.length === 0 ? (
        <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
          <CardContent className="pt-6 text-center py-12">
            <Settings className="w-16 h-16 text-[#555555] mx-auto mb-4" />
            <div className="text-[#888888] mb-2 text-lg font-medium">
              Nenhum template criado ainda
            </div>
            <p className="text-[#666666] text-sm mb-6 max-w-md mx-auto">
              Crie templates personalizados com perguntas avançadas para gerar copy mais precisa e direcionada.
            </p>
            <Button onClick={openCreateDialog} className="bg-[#3B82F6] hover:bg-[#2563EB]">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userTemplates.map((template) => (
            <Card key={template.id} className="bg-[#1E1E1E] border-[#4B5563]/20 hover:border-[#3B82F6]/30 transition-all duration-200 hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-[#3B82F6] border-[#3B82F6]/50 text-xs">
                        {getTypeLabel(template.quiz_type)}
                      </Badge>
                      <Badge variant="outline" className="text-[#10B981] border-[#10B981]/50 text-xs">
                        v{template.version}
                      </Badge>
                    </div>
                    <CardTitle className="text-white text-lg leading-tight">{template.title}</CardTitle>
                    {template.description && (
                      <CardDescription className="mt-2 text-sm">
                        {template.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#CCCCCC]">
                      <span className="font-medium">{getQuestionsLength(template.questions)}</span> perguntas
                    </span>
                    <span className="text-[#888888] text-xs">
                      {new Date(template.updated_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {onSelectTemplate && (
                      <Button
                        size="sm"
                        onClick={() => onSelectTemplate(template)}
                        className="bg-[#3B82F6] hover:bg-[#2563EB] flex-1 text-xs"
                      >
                        Usar Template
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDuplicate(template)}
                      className="border-[#4B5563] text-white hover:bg-[#2A2A2A]"
                      title="Duplicar"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(template)}
                      className="border-[#4B5563] text-white hover:bg-[#2A2A2A]"
                      title="Editar"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                          title="Excluir"
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
