import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Sparkles, Target, Clock } from 'lucide-react';
import { ModernButton } from '@/components/ui/modern-button';
import { ModernCard } from '@/components/ui/modern-card';
import { FloatingInput } from '@/components/ui/floating-input';
import { ModernProgress } from '@/components/ui/modern-progress';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { generateCopy } from '@/utils/copyGenerator';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const Quiz = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = React.useState(false);

  const questions = [
    {
      id: 'product',
      title: 'Qual é o seu produto ou serviço?',
      subtitle: 'Descreva em detalhes o que você oferece',
      type: 'textarea',
      placeholder: 'Ex: Curso online de culinária japonesa, Consultoria em marketing digital...',
      icon: <Target className="w-5 h-5" />
    },
    {
      id: 'target',
      title: 'Quem é seu público-alvo ideal?',
      subtitle: 'Seja específico sobre idade, interesses, problemas',
      type: 'textarea',
      placeholder: 'Ex: Mulheres de 25-45 anos interessadas em culinária, que querem aprender...',
      icon: <Target className="w-5 h-5" />
    },
    {
      id: 'pain',
      title: 'Qual a principal dor que seu produto resolve?',
      subtitle: 'O problema mais urgente do seu cliente',
      type: 'textarea',
      placeholder: 'Ex: Não sabem cozinhar pratos japoneses autênticos em casa...',
      icon: <Target className="w-5 h-5" />
    },
    {
      id: 'benefit',
      title: 'Qual o principal benefício oferecido?',
      subtitle: 'A transformação que seu cliente terá',
      type: 'textarea',
      placeholder: 'Ex: Conseguir preparar sushi profissional em casa em 30 dias...',
      icon: <Sparkles className="w-5 h-5" />
    },
    {
      id: 'price',
      title: 'Qual a faixa de preço do seu produto?',
      subtitle: 'Isso nos ajuda a criar a copy adequada',
      type: 'select',
      options: [
        'Até R$ 50',
        'R$ 51 - R$ 200',
        'R$ 201 - R$ 500',
        'R$ 501 - R$ 1.000',
        'R$ 1.001 - R$ 2.000',
        'Acima de R$ 2.000'
      ],
      icon: <Target className="w-5 h-5" />
    },
    {
      id: 'competitors',
      title: 'Quais são seus principais concorrentes?',
      subtitle: 'Nomes ou descrição dos competidores',
      type: 'textarea',
      placeholder: 'Ex: Curso X, Chef Y, outros cursos de culinária oriental...',
      icon: <Target className="w-5 h-5" />
    },
    {
      id: 'differential',
      title: 'Qual seu diferencial único?',
      subtitle: 'O que te torna especial no mercado',
      type: 'textarea',
      placeholder: 'Ex: Única brasileira certificada no Japão, método exclusivo de 30 dias...',
      icon: <Sparkles className="w-5 h-5" />
    },
    {
      id: 'objective',
      title: 'Qual o objetivo desta campanha?',
      subtitle: 'O que você quer alcançar',
      type: 'select',
      options: [
        'Gerar vendas diretas',
        'Capturar leads',
        'Aumentar o conhecimento da marca',
        'Educar o mercado',
        'Relançar produto'
      ],
      icon: <Target className="w-5 h-5" />
    }
  ];

  const currentQuestion = questions[state.currentQuizStep];
  const progress = ((state.currentQuizStep + 1) / questions.length) * 100;
  const isLastQuestion = state.currentQuizStep === questions.length - 1;
  const currentAnswer = state.quizAnswers[currentQuestion?.id as keyof typeof state.quizAnswers] || '';

  const handleAnswerChange = (value: string) => {
    if (currentQuestion) {
      dispatch({
        type: 'SET_QUIZ_ANSWER',
        field: currentQuestion.id as any,
        value
      });
    }
  };

  const handleNext = () => {
    if (!currentAnswer.trim()) {
      toast({
        title: 'Resposta obrigatória',
        description: 'Por favor, responda a pergunta antes de continuar.',
        variant: 'destructive'
      });
      return;
    }

    if (isLastQuestion) {
      handleGenerateCopy();
    } else {
      dispatch({ type: 'SET_QUIZ_STEP', step: state.currentQuizStep + 1 });
    }
  };

  const handlePrevious = () => {
    if (state.currentQuizStep > 0) {
      dispatch({ type: 'SET_QUIZ_STEP', step: state.currentQuizStep - 1 });
    }
  };

  const handleGenerateCopy = async () => {
    setIsGenerating(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const { adCopy, videoScript } = generateCopy(state.quizAnswers as any);
      
      const project = {
        id: Date.now().toString(),
        name: `Projeto ${new Date().toLocaleDateString()}`,
        answers: state.quizAnswers as any,
        adCopy,
        videoScript,
        createdAt: new Date()
      };

      dispatch({ type: 'CREATE_PROJECT', project });

      // Call webhook when quiz is completed
      try {
        console.log('Calling webhook for quiz completion...');
        await fetch('https://n8n.srv830837.hstgr.cloud/webhook/quiz-completed', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            projectId: project.id,
            answers: state.quizAnswers,
            generatedContent: {
              adCopy,
              videoScript
            }
          }),
        });
        console.log('Webhook called successfully');
      } catch (webhookError) {
        console.error('Error calling webhook:', webhookError);
        // Don't show error to user, just log it
      }
      
      toast({
        title: 'Copy gerada com sucesso!',
        description: 'Suas copies foram criadas e salvas no dashboard.',
      });
      
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Erro ao gerar copy',
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 safe-top safe-bottom">
        <ModernCard variant="glass" className="p-8 max-w-md mx-auto text-center animate-scale-in">
          <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
            <Sparkles className="w-10 h-10 text-white animate-float" />
          </div>
          
          <h2 className="text-2xl font-bold mb-4 text-gradient">
            Gerando suas copies...
          </h2>
          
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Nossa IA está analisando suas respostas e criando copies personalizadas para seu negócio.
          </p>
          
          <ModernProgress 
            value={70} 
            animated={true} 
            variant="gradient" 
            size="lg"
            className="mb-4"
          />
          
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Isso pode levar alguns segundos...</span>
          </div>
        </ModernCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 safe-top safe-bottom">
      <div className="max-w-2xl mx-auto">
        {/* Progress Section */}
        <div className="mb-8 animate-fade-in-up">
          <div className="flex justify-between text-sm text-muted-foreground mb-3">
            <span className="font-medium">
              Pergunta {state.currentQuizStep + 1} de {questions.length}
            </span>
            <span className="font-semibold text-gradient">
              {Math.round(progress)}% completo
            </span>
          </div>
          
          <ModernProgress 
            value={progress} 
            animated={true} 
            variant="gradient" 
            size="md"
          />
        </div>

        {/* Question Card */}
        <ModernCard 
          variant="glass" 
          className="p-8 animate-scale-in mb-6"
          style={{ animationDelay: '200ms' }}
        >
          <div className="mb-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse-glow">
                {currentQuestion?.icon}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold mb-3 text-gradient">
                  {currentQuestion?.title}
                </h1>
                <p className="text-muted-foreground leading-relaxed">
                  {currentQuestion?.subtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            {currentQuestion?.type === 'textarea' && (
              <div className="space-y-2">
                <Label htmlFor="answer" className="sr-only">Resposta</Label>
                <Textarea
                  id="answer"
                  placeholder={currentQuestion.placeholder}
                  value={currentAnswer}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  className="min-h-[120px] text-base glass-card border-0 focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
            )}

            {currentQuestion?.type === 'select' && (
              <Select value={currentAnswer} onValueChange={handleAnswerChange}>
                <SelectTrigger className="text-base glass-card border-0 focus:ring-2 focus:ring-primary/30 h-14">
                  <SelectValue placeholder="Selecione uma opção" />
                </SelectTrigger>
                <SelectContent className="glass-card border-0">
                  {currentQuestion.options?.map((option) => (
                    <SelectItem 
                      key={option} 
                      value={option}
                      className="hover:bg-white/10 cursor-pointer"
                    >
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {currentQuestion?.type === 'input' && (
              <FloatingInput
                label={currentQuestion.placeholder || 'Digite sua resposta'}
                value={currentAnswer}
                onChange={(value) => handleAnswerChange(value)}
                variant="glass"
                className="text-base"
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <ModernButton
              variant="ghost"
              onClick={handlePrevious}
              disabled={state.currentQuizStep === 0}
              className="group"
            >
              <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Anterior
            </ModernButton>

            <ModernButton
              onClick={handleNext}
              disabled={!currentAnswer.trim()}
              variant="gradient"
              className="min-w-[140px] group"
            >
              {isLastQuestion ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                  Gerar Copy
                </>
              ) : (
                <>
                  Próxima
                  <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </ModernButton>
          </div>
        </ModernCard>

        {/* Steps Indicator */}
        <div className="flex justify-center gap-2 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          {questions.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index <= state.currentQuizStep 
                  ? "bg-primary scale-125" 
                  : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Quiz;
