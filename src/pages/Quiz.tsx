
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { generateCopy } from '@/utils/copyGenerator';
import { useToast } from '@/hooks/use-toast';

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
      placeholder: 'Ex: Curso online de culinária japonesa, Consultoria em marketing digital...'
    },
    {
      id: 'target',
      title: 'Quem é seu público-alvo ideal?',
      subtitle: 'Seja específico sobre idade, interesses, problemas',
      type: 'textarea',
      placeholder: 'Ex: Mulheres de 25-45 anos interessadas em culinária, que querem aprender...'
    },
    {
      id: 'pain',
      title: 'Qual a principal dor que seu produto resolve?',
      subtitle: 'O problema mais urgente do seu cliente',
      type: 'textarea',
      placeholder: 'Ex: Não sabem cozinhar pratos japoneses autênticos em casa...'
    },
    {
      id: 'benefit',
      title: 'Qual o principal benefício oferecido?',
      subtitle: 'A transformação que seu cliente terá',
      type: 'textarea',
      placeholder: 'Ex: Conseguir preparar sushi profissional em casa em 30 dias...'
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
      ]
    },
    {
      id: 'competitors',
      title: 'Quais são seus principais concorrentes?',
      subtitle: 'Nomes ou descrição dos competidores',
      type: 'textarea',
      placeholder: 'Ex: Curso X, Chef Y, outros cursos de culinária oriental...'
    },
    {
      id: 'differential',
      title: 'Qual seu diferencial único?',
      subtitle: 'O que te torna especial no mercado',
      type: 'textarea',
      placeholder: 'Ex: Única brasileira certificada no Japão, método exclusivo de 30 dias...'
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
      ]
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
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-brand-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Gerando suas copies...</h2>
          <p className="text-muted-foreground mb-6">
            Nossa IA está analisando suas respostas e criando copies personalizadas para seu negócio.
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-brand-600 to-purple-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Pergunta {state.currentQuizStep + 1} de {questions.length}</span>
            <span>{Math.round(progress)}% completo</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-brand-600 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <Card className="p-8 animate-fade-in">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {currentQuestion?.title}
            </h1>
            <p className="text-muted-foreground">
              {currentQuestion?.subtitle}
            </p>
          </div>

          <div className="mb-8">
            <Label htmlFor="answer" className="sr-only">Resposta</Label>
            
            {currentQuestion?.type === 'textarea' && (
              <Textarea
                id="answer"
                placeholder={currentQuestion.placeholder}
                value={currentAnswer}
                onChange={(e) => handleAnswerChange(e.target.value)}
                className="min-h-[120px] text-base"
              />
            )}

            {currentQuestion?.type === 'select' && (
              <Select value={currentAnswer} onValueChange={handleAnswerChange}>
                <SelectTrigger className="text-base">
                  <SelectValue placeholder="Selecione uma opção" />
                </SelectTrigger>
                <SelectContent>
                  {currentQuestion.options?.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {currentQuestion?.type === 'input' && (
              <Input
                id="answer"
                placeholder={currentQuestion.placeholder}
                value={currentAnswer}
                onChange={(e) => handleAnswerChange(e.target.value)}
                className="text-base"
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={state.currentQuizStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>

            <Button
              onClick={handleNext}
              disabled={!currentAnswer.trim()}
              className="min-w-[120px]"
            >
              {isLastQuestion ? 'Gerar Copy' : 'Próxima'}
              {!isLastQuestion && <ChevronRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Quiz;
