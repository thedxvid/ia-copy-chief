import React, { useState, useEffect } from 'react';
import { QuizSelector } from './QuizSelector';
import { useQuizTemplates, parseQuestions, type QuizQuestion } from '@/hooks/useQuizTemplates';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, Sparkles, Save, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getQuizQuestions, getQuizTitle } from '@/data/quizQuestions';

// Mapeamento de tipos de quiz para tipos da API N8n
const mapQuizTypeToN8nType = (quizType: string): "vsl" | "ads" | "landing_page" | "email" => {
  const typeMapping: Record<string, "vsl" | "ads" | "landing_page" | "email"> = {
    'vsl': 'vsl',
    'ads': 'ads',
    'landing': 'landing_page',
    'product': 'landing_page',
    // Estrutura de oferta usa landing_page
    'email_marketing': 'email',
    'sales_letter': 'landing_page',
    'social_media': 'ads'
  };

  // Se for um template personalizado, extrair o tipo base
  if (quizType.startsWith('template_')) {
    // Para templates personalizados, usar landing_page como padrão
    return 'landing_page';
  }
  return typeMapping[quizType] || 'landing_page';
};
export const QuizFlow = () => {
  const {
    user
  } = useAuth();
  const {
    templates,
    isLoading: templatesLoading
  } = useQuizTemplates();
  const {
    saveQuizCopy
  } = useQuizCopySave();
  const {
    generateCopyWithN8n,
    isLoading: isGenerating
  } = useN8nIntegration();
  const {
    tokens,
    isOutOfTokens,
    showUpgradeModal,
    setShowUpgradeModal
  } = useTokens();
  const [selectedQuizType, setSelectedQuizType] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [generatedCopy, setGeneratedCopy] = useState<any>(null);
  const [copyTitle, setCopyTitle] = useState('');
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const handleQuizSelect = async (quizType: string, productId?: string) => {
    console.log('🎯 [QuizFlow] Quiz selecionado:', quizType, 'Produto:', productId);

    // Verificar se há tokens disponíveis
    if (isOutOfTokens()) {
      console.log('🚫 [QuizFlow] Usuário sem tokens - mostrando popup de upgrade');
      setShowUpgradeModal(true);
      return;
    }
    setSelectedQuizType(quizType);
    setSelectedProductId(productId || '');
    setIsLoadingQuestions(true);
    try {
      // Carregar perguntas do quiz
      const loadedQuestions = await getQuizQuestions(quizType);
      console.log('📝 [QuizFlow] Perguntas carregadas:', loadedQuestions.length);
      setQuestions(loadedQuestions);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setGeneratedCopy(null);
      setCopyTitle('');
    } catch (error) {
      console.error('❌ [QuizFlow] Erro ao carregar perguntas:', error);
      toast.error('Erro ao carregar perguntas do quiz');
    } finally {
      setIsLoadingQuestions(false);
    }
  };
  const handleProductChange = (productId: string | undefined) => {
    setSelectedProductId(productId || '');
  };
  const isCurrentQuestionAnswered = () => {
    if (!questions.length) return false;
    const question = questions[currentQuestionIndex];
    const answer = answers[question.id];

    // Para perguntas obrigatórias, verificar se há resposta
    if (question.required) {
      return answer && answer.toString().trim() !== '';
    }
    return true; // Perguntas não obrigatórias sempre passam
  };
  const handleAnswerChange = (questionId: string, value: any) => {
    console.log('📝 [QuizFlow] Resposta alterada:', questionId, value);
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };
  const handleGenerateCopy = async () => {
    if (!user || !selectedQuizType || !questions.length) return;

    // Verificar se há tokens disponíveis antes de gerar
    if (isOutOfTokens()) {
      console.log('🚫 [QuizFlow] Usuário sem tokens - mostrando popup de upgrade');
      setShowUpgradeModal(true);
      return;
    }
    try {
      console.log('🚀 [QuizFlow] Iniciando geração de copy');
      console.log('📊 [QuizFlow] Respostas:', answers);
      const targetAudience = answers.target_audience || answers.target || answers.publico_alvo || 'Público geral';
      const productInfo = answers.product_description || answers.product || answers.produto || 'Produto não especificado';

      // Mapear o tipo de quiz para o tipo esperado pela API N8n
      const n8nCopyType = mapQuizTypeToN8nType(selectedQuizType);
      console.log('🔄 [QuizFlow] Mapeamento de tipo:', selectedQuizType, '->', n8nCopyType);
      const result = await generateCopyWithN8n(user.id, answers, n8nCopyType, targetAudience, productInfo);
      console.log('✅ [QuizFlow] Copy gerado com sucesso:', result);
      setGeneratedCopy(result);
      const quizTitle = getQuizTitle(selectedQuizType);
      setCopyTitle(`${quizTitle} - ${new Date().toLocaleDateString()}`);
      toast.success('Copy gerado com sucesso!', {
        description: 'Seu conteúdo foi gerado e está pronto para ser salvo.'
      });
    } catch (error: any) {
      console.error('❌ [QuizFlow] Erro na geração:', error);

      // Se o erro for relacionado a tokens, mostrar popup de upgrade
      if (error.message?.includes('token') || error.message?.includes('Tokens insuficientes')) {
        console.log('🚫 [QuizFlow] Erro de tokens - mostrando popup de upgrade');
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
        quizType: selectedQuizType,
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
  const renderQuestionInput = (question: QuizQuestion) => {
    const value = answers[question.id] || '';
    switch (question.type) {
      case 'text':
        return <Input type="text" id={`question-${currentQuestionIndex}`} placeholder={question.placeholder} value={value} onChange={e => handleAnswerChange(question.id, e.target.value)} className="bg-[#1E1E1E] border-[#4B5563]/20 text-white" />;
      case 'textarea':
        return <Textarea id={`question-${currentQuestionIndex}`} placeholder={question.placeholder} value={value} onChange={e => handleAnswerChange(question.id, e.target.value)} className="bg-[#1E1E1E] border-[#4B5563]/20 text-white min-h-[100px]" maxLength={question.maxLength} />;
      case 'select':
        return <Select value={value} onValueChange={val => handleAnswerChange(question.id, val)}>
            <SelectTrigger className="bg-[#1E1E1E] border-[#4B5563]/20 text-white">
              <SelectValue placeholder="Selecione uma opção" />
            </SelectTrigger>
            <SelectContent className="bg-[#1E1E1E] border-[#4B5563]/20">
              {question.options?.map((option, index) => <SelectItem key={index} value={option} className="text-white hover:bg-[#3B82F6]/20">
                  {option}
                </SelectItem>)}
            </SelectContent>
          </Select>;
      case 'radio':
        return <RadioGroup value={value} onValueChange={val => handleAnswerChange(question.id, val)}>
            {question.options?.map((option, index) => <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="text-white cursor-pointer">
                  {option}
                </Label>
              </div>)}
          </RadioGroup>;
      case 'number':
        return <Input type="number" id={`question-${currentQuestionIndex}`} placeholder={question.placeholder} value={value} min={question.min} max={question.max} onChange={e => handleAnswerChange(question.id, e.target.value)} className="bg-[#1E1E1E] border-[#4B5563]/20 text-white" />;
      default:
        return <Input type="text" id={`question-${currentQuestionIndex}`} placeholder={question.placeholder} value={value} onChange={e => handleAnswerChange(question.id, e.target.value)} className="bg-[#1E1E1E] border-[#4B5563]/20 text-white" />;
    }
  };
  if (templatesLoading || isLoadingQuestions) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B82F6] mx-auto mb-4"></div>
          <p className="text-white">
            {templatesLoading ? 'Carregando templates...' : 'Carregando perguntas...'}
          </p>
        </div>
      </div>;
  }

  // Tela de seleção de quiz
  if (!selectedQuizType || !questions.length) {
    return <div className="space-y-6">
        <div className="text-center">
          
          
          
          {/* Aviso de tokens baixos - mas não bloqueia */}
          {tokens && tokens.total_available < 500 && tokens.total_available > 0 && <Card className="mt-4 border-orange-500/20 bg-orange-500/10">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-orange-300">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm">
                    Você possui {tokens.total_available.toLocaleString()} tokens. 
                    Cada quiz consome aproximadamente 200-300 tokens.
                  </p>
                </div>
              </CardContent>
            </Card>}
        </div>
        
        <QuizSelector onSelectQuiz={handleQuizSelect} selectedProductId={selectedProductId} onProductChange={handleProductChange} />
        
        <TokenUpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} tokensRemaining={tokens?.total_available || 0} isOutOfTokens={isOutOfTokens()} />
      </div>;
  }
  return <div className="space-y-6">
      {/* Quiz em andamento */}
      {!generatedCopy && <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-white">
                  {getQuizTitle(selectedQuizType)}
                  <Badge variant="secondary" className="bg-[#3B82F6]/20 text-[#3B82F6]">
                    {selectedQuizType}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-[#CCCCCC]">
                  Responda as perguntas para gerar sua copy personalizada
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-[#4B5563]/20 text-[#CCCCCC]">
                {currentQuestionIndex + 1} / {questions.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Barra de progresso */}
            <div className="w-full bg-[#4B5563]/20 rounded-full h-2">
              <div className="bg-[#3B82F6] h-2 rounded-full transition-all duration-300" style={{
            width: `${(currentQuestionIndex + 1) / questions.length * 100}%`
          }} />
            </div>

            {/* Pergunta atual */}
            {questions[currentQuestionIndex] && <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <Label htmlFor={`question-${currentQuestionIndex}`} className="text-white text-base font-medium">
                    {questions[currentQuestionIndex].question}
                    {questions[currentQuestionIndex].required && <span className="text-red-400 ml-1">*</span>}
                  </Label>
                </div>
                
                {questions[currentQuestionIndex].helpText && <p className="text-sm text-[#CCCCCC] -mt-2">
                    {questions[currentQuestionIndex].helpText}
                  </p>}
                
                {renderQuestionInput(questions[currentQuestionIndex])}
                
                {questions[currentQuestionIndex].maxLength && <div className="text-xs text-[#888888] text-right">
                    {(answers[questions[currentQuestionIndex].id] || '').length} / {questions[currentQuestionIndex].maxLength} caracteres
                  </div>}
              </div>}

            {/* Botões de navegação */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => {
            if (currentQuestionIndex === 0) {
              setSelectedQuizType('');
              setQuestions([]);
              setAnswers({});
            } else {
              setCurrentQuestionIndex(prev => prev - 1);
            }
          }} className="border-[#4B5563]/20 text-white hover:bg-[#4B5563]/20">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {currentQuestionIndex === 0 ? 'Voltar' : 'Anterior'}
              </Button>

              {currentQuestionIndex === questions.length - 1 ? <Button onClick={handleGenerateCopy} disabled={isGenerating || !isCurrentQuestionAnswered()} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  {isGenerating ? <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Gerando Copy...
                    </> : <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Gerar Copy
                    </>}
                </Button> : <Button onClick={() => setCurrentQuestionIndex(prev => prev + 1)} disabled={!isCurrentQuestionAnswered()} className="bg-[#3B82F6] hover:bg-[#2563EB] text-white">
                  Próxima
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>}
            </div>
          </CardContent>
        </Card>}

      {/* Copy gerado */}
      {generatedCopy && <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
          <CardHeader>
            <CardTitle className="text-white">Resultado da Geração</CardTitle>
            <CardDescription className="text-[#CCCCCC]">
              Aqui está o copy gerado com base nas suas respostas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="copy-title" className="text-white">Título da Copy</Label>
              <Input type="text" id="copy-title" placeholder="Título da sua copy" value={copyTitle} onChange={e => setCopyTitle(e.target.value)} className="bg-[#1E1E1E] border-[#4B5563]/20 text-white" />
            </div>
            <Textarea className="min-h-[300px] resize-none bg-[#1E1E1E] border-[#4B5563]/20 text-white" readOnly value={generatedCopy.result} />
            <Button onClick={handleSaveCopy} className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white" disabled={!copyTitle.trim()}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Copy
            </Button>
          </CardContent>
        </Card>}

      {/* Modal de upgrade de tokens */}
      <TokenUpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} tokensRemaining={tokens?.total_available || 0} isOutOfTokens={isOutOfTokens()} />
    </div>;
};