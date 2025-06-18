import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { QuizQuestion, getQuizQuestions, getQuizTitle } from '@/data/quizQuestions';
import { useProducts } from '@/hooks/useProducts';

interface QuizFlowProps {
  quizType: string;
  productId?: string;
  onComplete: (answers: Record<string, string>) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export const QuizFlow: React.FC<QuizFlowProps> = ({ 
  quizType, 
  productId, 
  onComplete, 
  onBack, 
  isLoading = false 
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const { fetchProductDetails } = useProducts();
  const [productDetails, setProductDetails] = useState<any>(null);
  const [hasPrefilledData, setHasPrefilledData] = useState(false);

  const quizTitle = getQuizTitle(quizType);
  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  // Carregar perguntas do quiz
  useEffect(() => {
    const loadQuestions = async () => {
      setQuestionsLoading(true);
      try {
        console.log(`🔄 Loading questions for quiz type: ${quizType}`);
        const loadedQuestions = await getQuizQuestions(quizType);
        console.log(`✅ Loaded ${loadedQuestions.length} questions for ${quizType}`);
        setQuestions(loadedQuestions);
      } catch (error) {
        console.error('❌ Error loading quiz questions:', error);
        setQuestions([]);
      } finally {
        setQuestionsLoading(false);
      }
    };

    if (quizType) {
      loadQuestions();
    }
  }, [quizType]);

  // Carregar detalhes do produto se ID foi fornecido
  useEffect(() => {
    if (productId && !hasPrefilledData) {
      fetchProductDetails(productId).then(details => {
        if (details) {
          setProductDetails(details);
          
          // Pré-preencher respostas baseadas no produto
          const prefilledAnswers: Record<string, string> = {};
          
          // Preencher nome do produto
          if (details.name) {
            prefilledAnswers['product'] = details.name;
          }
          
          // Preencher público-alvo se disponível
          if (details.strategy?.target_audience) {
            const audience = typeof details.strategy.target_audience === 'string' 
              ? details.strategy.target_audience 
              : JSON.stringify(details.strategy.target_audience);
            prefilledAnswers['target'] = audience;
          }
          
          // Preencher proposta de valor
          if (details.strategy?.value_proposition) {
            prefilledAnswers['benefit'] = details.strategy.value_proposition;
          }
          
          // Preencher preço se disponível
          if (details.offer?.pricing_strategy) {
            const pricing = typeof details.offer.pricing_strategy === 'string'
              ? details.offer.pricing_strategy
              : JSON.stringify(details.offer.pricing_strategy);
            prefilledAnswers['price'] = pricing;
          }
          
          // Só aplicar as respostas pré-preenchidas se ainda não foram definidas
          setAnswers(prevAnswers => {
            const newAnswers = { ...prevAnswers };
            Object.keys(prefilledAnswers).forEach(key => {
              if (!newAnswers[key]) {
                newAnswers[key] = prefilledAnswers[key];
              }
            });
            return newAnswers;
          });
          
          // Se a primeira pergunta tem resposta pré-preenchida, definir como resposta atual
          if (questions[0] && prefilledAnswers[questions[0].id] && !currentAnswer) {
            setCurrentAnswer(prefilledAnswers[questions[0].id]);
          }
          
          setHasPrefilledData(true);
        }
      });
    }
  }, [productId, fetchProductDetails, questions, hasPrefilledData, currentAnswer]);

  // Atualizar resposta atual quando mudar de pergunta
  useEffect(() => {
    if (questions[currentQuestion]) {
      const questionId = questions[currentQuestion].id;
      setCurrentAnswer(answers[questionId] || '');
    }
  }, [currentQuestion, answers, questions]);

  const handleNext = () => {
    if (currentAnswer.trim() || !questions[currentQuestion].required) {
      const newAnswers = { ...answers };
      newAnswers[questions[currentQuestion].id] = currentAnswer;
      setAnswers(newAnswers);
      
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        // Definir a resposta atual para a próxima pergunta
        const nextQuestionId = questions[currentQuestion + 1]?.id;
        setCurrentAnswer(newAnswers[nextQuestionId] || '');
      } else {
        onComplete(newAnswers);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      const prevQuestionId = questions[currentQuestion - 1].id;
      setCurrentAnswer(answers[prevQuestionId] || '');
    }
  };

  const handleAnswerChange = (value: string) => {
    setCurrentAnswer(value);
    // Atualizar imediatamente no estado de respostas
    const newAnswers = { ...answers };
    newAnswers[questions[currentQuestion].id] = value;
    setAnswers(newAnswers);
  };

  const renderQuestionInput = (question: QuizQuestion) => {
    const isPrefilledField = productDetails && answers[question.id] && hasPrefilledData;
    
    switch (question.type) {
      case 'radio':
        return (
          <RadioGroup value={currentAnswer} onValueChange={handleAnswerChange}>
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-[#2A2A2A] transition-colors">
                <RadioGroupItem 
                  value={option} 
                  id={`option-${index}`}
                  className="border-[#4B5563] text-[#3B82F6]"
                />
                <Label 
                  htmlFor={`option-${index}`} 
                  className="text-white cursor-pointer flex-1 text-base"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
        
      case 'textarea':
        return (
          <div className="space-y-2">
            <Textarea
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder={question.placeholder}
              className="min-h-[120px] bg-[#2A2A2A] border-[#4B5563] text-white placeholder:text-[#888888] text-base focus:border-[#3B82F6] focus:ring-[#3B82F6]"
            />
            {isPrefilledField && (
              <p className="text-xs text-[#3B82F6]">
                ✓ Campo pré-preenchido baseado no produto selecionado - você pode editar
              </p>
            )}
          </div>
        );
        
      case 'text':
        return (
          <div className="space-y-2">
            <Input
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder={question.placeholder}
              className="bg-[#2A2A2A] border-[#4B5563] text-white placeholder:text-[#888888] text-base focus:border-[#3B82F6] focus:ring-[#3B82F6]"
            />
            {isPrefilledField && (
              <p className="text-xs text-[#3B82F6]">
                ✓ Campo pré-preenchido baseado no produto selecionado - você pode editar
              </p>
            )}
          </div>
        );
        
      case 'number':
        return (
          <div className="space-y-2">
            <Input
              type="number"
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder={question.placeholder}
              className="bg-[#2A2A2A] border-[#4B5563] text-white placeholder:text-[#888888] text-base focus:border-[#3B82F6] focus:ring-[#3B82F6]"
            />
            {isPrefilledField && (
              <p className="text-xs text-[#3B82F6]">
                ✓ Campo pré-preenchido baseado no produto selecionado - você pode editar
              </p>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  if (questionsLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Carregando Quiz</h2>
          <p className="text-[#CCCCCC]">Preparando as perguntas personalizadas...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-white mb-4">Quiz não encontrado</h2>
        <p className="text-[#CCCCCC] mb-6">
          Não foi possível carregar as perguntas para este tipo de quiz.
        </p>
        <Button onClick={onBack} variant="outline">
          Voltar à seleção
        </Button>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const isAnswered = currentAnswer.trim() !== '';
  const canProceed = !currentQ.required || isAnswered;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={isLoading}
          className="text-[#CCCCCC] hover:text-white hover:bg-[#2A2A2A]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{quizTitle}</h1>
          <p className="text-[#CCCCCC]">
            Pergunta {currentQuestion + 1} de {questions.length}
            {productDetails && (
              <span className="ml-2 text-[#3B82F6]">
                • Contexto: {productDetails.name}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[#CCCCCC]">Progresso</span>
          <span className="text-sm text-[#CCCCCC]">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
        <CardHeader>
          <CardTitle className="text-white text-xl leading-relaxed">
            {currentQ.question}
            {currentQ.required && <span className="text-red-400 ml-1">*</span>}
          </CardTitle>
          {currentQ.type === 'radio' && (
            <CardDescription className="text-[#CCCCCC]">
              Selecione a opção que melhor descreve sua situação
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          {renderQuestionInput(currentQ)}
          
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6] mr-3" />
              <span className="text-white">Gerando sua copy personalizada com Claude AI...</span>
            </div>
          )}
          
          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-[#4B5563]/20">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0 || isLoading}
              className="border-[#4B5563] text-white hover:bg-[#2A2A2A]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
            
            <div className="text-center">
              <div className="text-sm text-[#888888]">
                {currentQuestion + 1} / {questions.length}
              </div>
            </div>
            
            <Button
              onClick={handleNext}
              disabled={!canProceed || isLoading}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : currentQuestion === questions.length - 1 ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Finalizar
                </>
              ) : (
                <>
                  Próxima
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Help text */}
      <div className="text-center text-[#888888] text-sm">
        💡 Responda com o máximo de detalhes possível para obter copies mais precisas via Claude AI
        {productDetails && (
          <div className="mt-2 text-[#3B82F6]">
            🎯 Algumas respostas foram pré-preenchidas baseadas no produto "{productDetails.name}" - você pode editá-las
          </div>
        )}
      </div>
    </div>
  );
};
