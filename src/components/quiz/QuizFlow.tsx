
import React, { useState, useEffect } from 'react';
import { QuizSelector } from './QuizSelector';
import { useQuizTemplates } from '@/hooks/useQuizTemplates';
import { useQuizCopySave } from '@/hooks/useQuizCopySave';
import { useN8nIntegration } from '@/hooks/useN8nIntegration';
import { useTokens } from '@/hooks/useTokens';
import { TokenUpgradeModal } from '@/components/tokens/TokenUpgradeModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, Sparkles, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface QuizTemplate {
  id: string;
  title: string;
  description: string;
  quiz_type: string;
  questions: QuizQuestion[];
}

interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options: string[];
  required: boolean;
}

export const QuizFlow = () => {
  const { user } = useAuth();
  const { templates, isLoading: templatesLoading } = useQuizTemplates();
  const { saveQuizCopy } = useQuizCopySave();
  const { generateCopyWithN8n, isLoading: isGenerating } = useN8nIntegration();
  const { tokens, isOutOfTokens, showUpgradeModal, setShowUpgradeModal } = useTokens();
  
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [generatedCopy, setGeneratedCopy] = useState<any>(null);
  const [copyTitle, setCopyTitle] = useState('');

  const isCurrentQuestionAnswered = () => {
    if (!selectedTemplate || !selectedTemplate.questions) return false;
    const question = selectedTemplate.questions[currentQuestionIndex];
    return !!answers[question.id];
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleTemplateSelect = (template: any) => {
    // Verificar se há tokens disponíveis
    if (isOutOfTokens()) {
      console.log('🚫 [Quiz] Usuário sem tokens - mostrando popup de upgrade');
      setShowUpgradeModal(true);
      return;
    }
    
    setSelectedTemplate(template);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setGeneratedCopy(null);
  };

  const handleGenerateCopy = async () => {
    if (!user || !selectedTemplate) return;

    // Verificar se há tokens disponíveis antes de gerar
    if (isOutOfTokens()) {
      console.log('🚫 [Quiz] Usuário sem tokens - mostrando popup de upgrade');
      setShowUpgradeModal(true);
      return;
    }

    try {
      console.log('🚀 [Quiz] Iniciando geração de copy');
      
      const targetAudience = answers.target_audience || 'Público geral';
      const productInfo = answers.product_description || 'Produto não especificado';

      const result = await generateCopyWithN8n(
        user.id,
        answers,
        selectedTemplate.quiz_type,
        targetAudience,
        productInfo
      );

      console.log('✅ [Quiz] Copy gerado com sucesso:', result);
      setGeneratedCopy(result);
      setCopyTitle(`${selectedTemplate.title} - ${new Date().toLocaleDateString()}`);
      
      toast.success('Copy gerado com sucesso!', {
        description: 'Seu conteúdo foi gerado e está pronto para ser salvo.'
      });

    } catch (error: any) {
      console.error('❌ [Quiz] Erro na geração:', error);
      
      // Se o erro for relacionado a tokens, mostrar popup de upgrade
      if (error.message?.includes('token') || error.message?.includes('Tokens insuficientes')) {
        console.log('🚫 [Quiz] Erro de tokens - mostrando popup de upgrade');
        setShowUpgradeModal(true);
      } else {
        toast.error('Erro na geração', {
          description: error.message || 'Tente novamente em alguns instantes.'
        });
      }
    }
  };

  const handleSaveCopy = async () => {
    if (!generatedCopy || !copyTitle) return;

    try {
      await saveQuizCopy({
        quizType: selectedTemplate.quiz_type,
        quizAnswers: answers,
        generatedCopy: {
          title: copyTitle,
          content: generatedCopy.result
        }
      });

      toast.success('Copy salvo com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar copy:', error);
      toast.error('Erro ao salvar copy', {
        description: error.message || 'Tente novamente em alguns instantes.'
      });
    }
  };

  if (templatesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando templates...</p>
        </div>
      </div>
    );
  }

  // Template selection screen
  if (!selectedTemplate) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Escolha o Tipo de Copy</h2>
          <p className="text-muted-foreground">
            Selecione o template que melhor se adequa ao seu objetivo
          </p>
          
          {/* Aviso de tokens baixos - mas não bloqueia */}
          {tokens && tokens.total_available < 500 && tokens.total_available > 0 && (
            <Card className="mt-4 border-orange-200 bg-orange-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-orange-700">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm">
                    Você possui {tokens.total_available.toLocaleString()} tokens. 
                    Cada quiz consome aproximadamente 200-300 tokens.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        <QuizSelector onSelectQuiz={handleTemplateSelect} />
        
        <TokenUpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          tokensRemaining={tokens?.total_available || 0}
          isOutOfTokens={isOutOfTokens()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quiz progress and questions */}
      {!generatedCopy && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {selectedTemplate.title}
                  <Badge variant="secondary">{selectedTemplate.quiz_type}</Badge>
                </CardTitle>
                <CardDescription>{selectedTemplate.description}</CardDescription>
              </div>
              <Badge variant="outline">
                {currentQuestionIndex + 1} / {selectedTemplate.questions?.length || 0}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentQuestionIndex + 1) / (selectedTemplate.questions?.length || 1)) * 100}%`
                }}
              />
            </div>

            {/* Current question */}
            {selectedTemplate.questions && selectedTemplate.questions[currentQuestionIndex] && (
              <div className="space-y-4">
                <Label htmlFor={`question-${currentQuestionIndex}`}>
                  {selectedTemplate.questions[currentQuestionIndex].question_text}
                </Label>
                {selectedTemplate.questions[currentQuestionIndex].question_type === 'text' && (
                  <Input
                    type="text"
                    id={`question-${currentQuestionIndex}`}
                    value={answers[selectedTemplate.questions[currentQuestionIndex].id] || ''}
                    onChange={(e) =>
                      handleAnswerChange(selectedTemplate.questions[currentQuestionIndex].id, e.target.value)
                    }
                  />
                )}
                {selectedTemplate.questions[currentQuestionIndex].question_type === 'textarea' && (
                  <Textarea
                    id={`question-${currentQuestionIndex}`}
                    value={answers[selectedTemplate.questions[currentQuestionIndex].id] || ''}
                    onChange={(e) =>
                      handleAnswerChange(selectedTemplate.questions[currentQuestionIndex].id, e.target.value)
                    }
                  />
                )}
                {selectedTemplate.questions[currentQuestionIndex].question_type === 'select' && (
                  <select
                    id={`question-${currentQuestionIndex}`}
                    className="w-full px-4 py-2 rounded-md bg-white border border-gray-300 focus:outline-none focus:border-primary"
                    value={answers[selectedTemplate.questions[currentQuestionIndex].id] || ''}
                    onChange={(e) =>
                      handleAnswerChange(selectedTemplate.questions[currentQuestionIndex].id, e.target.value)
                    }
                  >
                    <option value="">Selecione uma opção</option>
                    {selectedTemplate.questions[currentQuestionIndex].options?.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  if (currentQuestionIndex === 0) {
                    setSelectedTemplate(null);
                  } else {
                    setCurrentQuestionIndex(prev => prev - 1);
                  }
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {currentQuestionIndex === 0 ? 'Voltar' : 'Anterior'}
              </Button>

              {currentQuestionIndex === (selectedTemplate.questions?.length || 1) - 1 ? (
                <Button
                  onClick={handleGenerateCopy}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Gerando Copy...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Gerar Copy
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  disabled={!isCurrentQuestionAnswered()}
                >
                  Próxima
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated copy display */}
      {generatedCopy && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado da Geração</CardTitle>
            <CardDescription>
              Aqui está o copy gerado com base nas suas respostas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="copy-title">Título da Copy</Label>
              <Input
                type="text"
                id="copy-title"
                placeholder="Título da sua copy"
                value={copyTitle}
                onChange={(e) => setCopyTitle(e.target.value)}
              />
            </div>
            <Textarea
              className="min-h-[200px] resize-none bg-muted/50"
              readOnly
              value={generatedCopy.result}
            />
            <Button onClick={handleSaveCopy} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Salvar Copy
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Token upgrade modal */}
      <TokenUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        tokensRemaining={tokens?.total_available || 0}
        isOutOfTokens={isOutOfTokens()}
      />
    </div>
  );
};
