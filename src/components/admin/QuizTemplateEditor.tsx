
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { QuizTemplate, QuizQuestion, useQuizTemplates } from '@/hooks/useQuizTemplates';
import { Plus, Trash2, GripVertical, Copy, Eye, Save, ArrowLeft } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { toast } from 'sonner';

interface QuizTemplateEditorProps {
  template?: QuizTemplate;
  onBack: () => void;
  onSave: (template: QuizTemplate) => void;
}

export const QuizTemplateEditor: React.FC<QuizTemplateEditorProps> = ({
  template,
  onBack,
  onSave
}) => {
  const { createTemplate, updateTemplate, parseQuestions } = useQuizTemplates();
  const [formData, setFormData] = useState({
    quiz_type: template?.quiz_type || '',
    title: template?.title || '',
    description: template?.description || '',
    is_default: template?.is_default || false,
    is_active: template?.is_active ?? true
  });
  
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    template ? parseQuestions(template.questions) : []
  );
  const [isSaving, setIsSaving] = useState(false);

  const quizTypes = [
    { value: 'vsl', label: 'Vídeo de Vendas (VSL)' },
    { value: 'product', label: 'Estrutura de Oferta' },
    { value: 'landing', label: 'Landing Page' },
    { value: 'ads', label: 'Anúncios Pagos' }
  ];

  const questionTypes = [
    { value: 'textarea', label: 'Texto Longo' },
    { value: 'text', label: 'Texto Curto' },
    { value: 'radio', label: 'Múltipla Escolha' },
    { value: 'number', label: 'Número' }
  ];

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `question_${Date.now()}`,
      question: '',
      type: 'textarea',
      required: true,
      placeholder: ''
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const duplicateQuestion = (index: number) => {
    const questionToDuplicate = { ...questions[index] };
    questionToDuplicate.id = `question_${Date.now()}`;
    questionToDuplicate.question = `${questionToDuplicate.question} (Cópia)`;
    setQuestions([...questions.slice(0, index + 1), questionToDuplicate, ...questions.slice(index + 1)]);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const reorderedQuestions = Array.from(questions);
    const [removed] = reorderedQuestions.splice(result.source.index, 1);
    reorderedQuestions.splice(result.destination.index, 0, removed);

    setQuestions(reorderedQuestions);
  };

  const handleSave = async () => {
    if (!formData.quiz_type || !formData.title || questions.length === 0) {
      toast.error('Preencha todos os campos obrigatórios e adicione pelo menos uma pergunta');
      return;
    }

    setIsSaving(true);
    try {
      const templateData = {
        ...formData,
        questions,
        version: template ? template.version + 1 : 1
      };

      let savedTemplate;
      if (template) {
        savedTemplate = await updateTemplate(template.id, templateData);
      } else {
        savedTemplate = await createTemplate(templateData);
      }

      if (savedTemplate) {
        onSave(savedTemplate);
      }
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addOption = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    if (!updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options = [];
    }
    updatedQuestions[questionIndex].options!.push('');
    setQuestions(updatedQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options![optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options!.splice(optionIndex, 1);
    setQuestions(updatedQuestions);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {template ? 'Editar Template' : 'Novo Template'}
            </h1>
            <p className="text-[#CCCCCC]">
              {template ? `Editando: ${template.title}` : 'Criar um novo template de quiz'}
            </p>
          </div>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-[#3B82F6] hover:bg-[#2563EB]"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Salvando...' : 'Salvar Template'}
        </Button>
      </div>

      {/* Template Info */}
      <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
        <CardHeader>
          <CardTitle className="text-white">Informações do Template</CardTitle>
          <CardDescription>Configure as informações básicas do template</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quiz_type" className="text-white">Tipo de Quiz *</Label>
              <Select value={formData.quiz_type} onValueChange={(value) => setFormData({...formData, quiz_type: value})}>
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
              <Label htmlFor="title" className="text-white">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="bg-[#2A2A2A] border-[#4B5563] text-white"
                placeholder="Ex: Quiz para Vídeo de Vendas"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-white">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="bg-[#2A2A2A] border-[#4B5563] text-white"
              placeholder="Descreva o objetivo deste quiz..."
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({...formData, is_default: checked})}
              />
              <Label className="text-white">Template Padrão</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
              <Label className="text-white">Ativo</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Perguntas do Quiz</CardTitle>
              <CardDescription>Arraste para reordenar as perguntas</CardDescription>
            </div>
            <Button onClick={addQuestion} className="bg-[#3B82F6] hover:bg-[#2563EB]">
              <Plus className="w-4 h-4 mr-2" />
              Nova Pergunta
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="questions">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {questions.map((question, index) => (
                    <Draggable key={question.id} draggableId={question.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="bg-[#2A2A2A] border border-[#4B5563]/20 rounded-lg p-4 space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div {...provided.dragHandleProps}>
                                <GripVertical className="w-4 h-4 text-[#888888] cursor-grab" />
                              </div>
                              <Badge variant="outline" className="text-[#CCCCCC]">
                                Pergunta {index + 1}
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => duplicateQuestion(index)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeQuestion(index)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-white">Pergunta *</Label>
                              <Textarea
                                value={question.question}
                                onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                                className="bg-[#1A1A1A] border-[#4B5563] text-white"
                                placeholder="Digite a pergunta..."
                              />
                            </div>
                            
                            <div>
                              <Label className="text-white">Tipo</Label>
                              <Select
                                value={question.type}
                                onValueChange={(value) => updateQuestion(index, 'type', value)}
                              >
                                <SelectTrigger className="bg-[#1A1A1A] border-[#4B5563] text-white">
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

                          <div>
                            <Label className="text-white">Placeholder/Ajuda</Label>
                            <Input
                              value={question.placeholder || ''}
                              onChange={(e) => updateQuestion(index, 'placeholder', e.target.value)}
                              className="bg-[#1A1A1A] border-[#4B5563] text-white"
                              placeholder="Texto de ajuda para o usuário..."
                            />
                          </div>

                          {question.type === 'radio' && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <Label className="text-white">Opções</Label>
                                <Button
                                  size="sm"
                                  onClick={() => addOption(index)}
                                  className="bg-[#3B82F6] hover:bg-[#2563EB]"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Opção
                                </Button>
                              </div>
                              <div className="space-y-2">
                                {(question.options || []).map((option, optionIndex) => (
                                  <div key={optionIndex} className="flex gap-2">
                                    <Input
                                      value={option}
                                      onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                                      className="bg-[#1A1A1A] border-[#4B5563] text-white"
                                      placeholder={`Opção ${optionIndex + 1}`}
                                    />
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => removeOption(index, optionIndex)}
                                      className="text-red-400 hover:text-red-300"
                                    >
                                      <Trash2 className="w-4 h-4" />
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
                            <Label className="text-white">Campo obrigatório</Label>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {questions.length === 0 && (
            <div className="text-center py-8 text-[#888888]">
              Nenhuma pergunta adicionada ainda. Clique em "Nova Pergunta" para começar.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
