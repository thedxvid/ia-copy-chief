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
  const [prefilledFields, setPrefilledFields] = useState<Set<string>>(new Set());

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

  // Função melhorada para mapear campos do produto para IDs das perguntas do quiz
  const mapProductDataToQuizAnswers = (productDetails: any): Record<string, string> => {
    const mappedAnswers: Record<string, string> = {};
    const prefilledSet = new Set<string>();
    
    // Função auxiliar para extrair texto de objetos complexos
    const extractText = (value: any): string => {
      if (!value) return '';
      if (typeof value === 'string') return value;
      if (typeof value === 'object' && !Array.isArray(value)) {
        // Tentar extrair campos comuns de objetos
        const textFields = ['text', 'content', 'description', 'value', 'headline', 'title', 'body'];
        for (const field of textFields) {
          if (value[field] && typeof value[field] === 'string') {
            return value[field];
          }
        }
        return JSON.stringify(value, null, 2);
      }
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return String(value);
    };

    // Mapeamento direto de campos básicos
    const basicFieldMappings = {
      // Nome do produto
      'product': productDetails.name,
      'product_name': productDetails.name,
      'nome_produto': productDetails.name,
      'produto': productDetails.name,
      
      // Nicho
      'niche': productDetails.niche,
      'nicho': productDetails.niche,
      'mercado': productDetails.niche,
      
      // Sub-nicho
      'sub_niche': productDetails.sub_niche,
      'sub_nicho': productDetails.sub_niche,
      'submercado': productDetails.sub_niche,
    };

    // Mapeamento de estratégia
    if (productDetails.strategy) {
      const strategyMappings = {
        // Público-alvo
        'target': extractText(productDetails.strategy.target_audience),
        'target_audience': extractText(productDetails.strategy.target_audience),
        'publico_alvo': extractText(productDetails.strategy.target_audience),
        'publico': extractText(productDetails.strategy.target_audience),
        'audience': extractText(productDetails.strategy.target_audience),
        'cliente': extractText(productDetails.strategy.target_audience),
        'persona': extractText(productDetails.strategy.target_audience),
        
        // Proposta de valor
        'benefit': productDetails.strategy.value_proposition,
        'benefits': productDetails.strategy.value_proposition,
        'value_proposition': productDetails.strategy.value_proposition,
        'proposta_valor': productDetails.strategy.value_proposition,
        'produto_benefits': productDetails.strategy.value_proposition,
        'beneficios': productDetails.strategy.value_proposition,
        'vantagem': productDetails.strategy.value_proposition,
        'diferencial': productDetails.strategy.value_proposition,
        'problema_solucao': productDetails.strategy.value_proposition,
        'solucao': productDetails.strategy.value_proposition,
        
        // Posicionamento
        'positioning': productDetails.strategy.market_positioning,
        'market_positioning': productDetails.strategy.market_positioning,
        'posicionamento': productDetails.strategy.market_positioning,
        'posicao_mercado': productDetails.strategy.market_positioning,
      };
      Object.assign(basicFieldMappings, strategyMappings);
    }

    // Mapeamento de ofertas
    if (productDetails.offer) {
      const offerMappings = {
        // Oferta principal
        'offer': extractText(productDetails.offer.main_offer),
        'main_offer': extractText(productDetails.offer.main_offer),
        'oferta_principal': extractText(productDetails.offer.main_offer),
        'oferta': extractText(productDetails.offer.main_offer),
        'produto_oferta': extractText(productDetails.offer.main_offer),
        
        // Preço
        'price': extractText(productDetails.offer.pricing_strategy),
        'pricing': extractText(productDetails.offer.pricing_strategy),
        'preco': extractText(productDetails.offer.pricing_strategy),
        'valor': extractText(productDetails.offer.pricing_strategy),
        'investimento': extractText(productDetails.offer.pricing_strategy),
        'custo': extractText(productDetails.offer.pricing_strategy),
        
        // Bônus
        'bonus': productDetails.offer.bonuses ? productDetails.offer.bonuses.join(', ') : '',
        'bonuses': productDetails.offer.bonuses ? productDetails.offer.bonuses.join(', ') : '',
        'extras': productDetails.offer.bonuses ? productDetails.offer.bonuses.join(', ') : '',
        'adicionais': productDetails.offer.bonuses ? productDetails.offer.bonuses.join(', ') : '',
        
        // Upsell/Downsell
        'upsell': extractText(productDetails.offer.upsell),
        'downsell': extractText(productDetails.offer.downsell),
        'order_bump': extractText(productDetails.offer.order_bump),
      };
      Object.assign(basicFieldMappings, offerMappings);
    }

    // Mapeamento de copy existente
    if (productDetails.copy) {
      const copyMappings = {
        'vsl_script': productDetails.copy.vsl_script,
        'script': productDetails.copy.vsl_script,
        'roteiro': productDetails.copy.vsl_script,
        'landing_copy': extractText(productDetails.copy.landing_page_copy),
        'email_copy': extractText(productDetails.copy.email_campaign),
        'social_copy': extractText(productDetails.copy.social_media_content),
        'whatsapp': productDetails.copy.whatsapp_messages ? productDetails.copy.whatsapp_messages.join('\n') : '',
        'telegram': productDetails.copy.telegram_messages ? productDetails.copy.telegram_messages.join('\n') : '',
      };
      Object.assign(basicFieldMappings, copyMappings);
    }

    // Mapeamento de meta dados
    if (productDetails.meta) {
      const metaMappings = {
        'tags': productDetails.meta.tags ? productDetails.meta.tags.join(', ') : '',
        'notes': productDetails.meta.private_notes,
        'notas': productDetails.meta.private_notes,
        'observacoes': productDetails.meta.private_notes,
      };
      Object.assign(basicFieldMappings, metaMappings);
    }

    // Aplicar mapeamentos que têm valores válidos
    Object.entries(basicFieldMappings).forEach(([key, value]) => {
      if (value && typeof value === 'string' && value.trim() !== '' && value !== 'null' && value !== 'undefined') {
        mappedAnswers[key] = value.trim();
        prefilledSet.add(key);
      }
    });

    // Mapeamento inteligente baseado em palavras-chave nas perguntas
    questions.forEach(question => {
      const questionLower = question.question.toLowerCase();
      const questionId = question.id.toLowerCase();
      
      // Se já foi mapeado diretamente, pular
      if (mappedAnswers[question.id]) return;
      
      // Mapear baseado no conteúdo da pergunta
      if ((questionLower.includes('público') || questionLower.includes('target') || questionLower.includes('cliente')) && 
          productDetails.strategy?.target_audience) {
        mappedAnswers[question.id] = extractText(productDetails.strategy.target_audience);
        prefilledSet.add(question.id);
      } else if ((questionLower.includes('benefício') || questionLower.includes('vantagem') || questionLower.includes('solução')) && 
                 productDetails.strategy?.value_proposition) {
        mappedAnswers[question.id] = productDetails.strategy.value_proposition;
        prefilledSet.add(question.id);
      } else if ((questionLower.includes('preço') || questionLower.includes('valor') || questionLower.includes('custo')) && 
                 productDetails.offer?.pricing_strategy) {
        mappedAnswers[question.id] = extractText(productDetails.offer.pricing_strategy);
        prefilledSet.add(question.id);
      } else if ((questionLower.includes('oferta') || questionLower.includes('produto') || questionLower.includes('serviço')) && 
                 productDetails.offer?.main_offer) {
        mappedAnswers[question.id] = extractText(productDetails.offer.main_offer);
        prefilledSet.add(question.id);
      }
    });

    setPrefilledFields(prefilledSet);
    return mappedAnswers;
  };

  // Carregar detalhes do produto e pré-preencher respostas
  useEffect(() => {
    if (productId && questions.length > 0) {
      console.log(`🔄 Loading product details for ID: ${productId}`);
      fetchProductDetails(productId).then(details => {
        if (details) {
          console.log(`✅ Product details loaded:`, details);
          setProductDetails(details);
          
          // Mapear dados do produto para respostas do quiz
          const prefilledAnswers = mapProductDataToQuizAnswers(details);
          console.log(`🎯 Pre-filled answers:`, prefilledAnswers);
          console.log(`📝 Pre-filled fields:`, Array.from(prefilledFields));
          
          // Aplicar respostas pré-preenchidas
          setAnswers(prevAnswers => {
            const newAnswers = { ...prevAnswers };
            Object.entries(prefilledAnswers).forEach(([key, value]) => {
              if (!newAnswers[key] && value) {
                newAnswers[key] = value;
              }
            });
            return newAnswers;
          });
          
          // Se a primeira pergunta tem resposta pré-preenchida, definir como resposta atual
          if (questions[0] && prefilledAnswers[questions[0].id] && !currentAnswer) {
            setCurrentAnswer(prefilledAnswers[questions[0].id]);
          }
        }
      }).catch(error => {
        console.error('❌ Error loading product details:', error);
      });
    }
  }, [productId, questions, fetchProductDetails]);

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
    const isPrefilledField = prefilledFields.has(question.id) && answers[question.id];
    
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
              <p className="text-xs text-[#3B82F6] flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Campo pré-preenchido baseado no produto "{productDetails?.name}" - você pode editar
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
              <p className="text-xs text-[#3B82F6] flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Campo pré-preenchido baseado no produto "{productDetails?.name}" - você pode editar
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
              <p className="text-xs text-[#3B82F6] flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Campo pré-preenchido baseado no produto "{productDetails?.name}" - você pode editar
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
  const prefilledCount = prefilledFields.size;

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
                {prefilledCount > 0 && (
                  <span className="ml-1">
                    ({prefilledCount} campos pré-preenchidos)
                  </span>
                )}
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
        {productDetails && prefilledCount > 0 && (
          <div className="mt-2 text-[#3B82F6]">
            🎯 {prefilledCount} campos foram pré-preenchidos baseados no produto "{productDetails.name}" - você pode editá-los conforme necessário
          </div>
        )}
      </div>
    </div>
  );
};
