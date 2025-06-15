import React, { useState } from 'react';
import { QuizSelector } from '@/components/quiz/QuizSelector';
import { QuizFlow } from '@/components/quiz/QuizFlow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useQuizCopySave } from '@/hooks/useQuizCopySave';
import { useN8nIntegration } from '@/hooks/useN8nIntegration';
import { Copy, Download, RotateCcw, History, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const Quiz = () => {
  const [currentStep, setCurrentStep] = useState<'selector' | 'quiz' | 'result'>('selector');
  const [selectedQuizType, setSelectedQuizType] = useState<string>('');
  const [generatedCopy, setGeneratedCopy] = useState<{ title: string; content: string } | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedCopyId, setSavedCopyId] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { saveQuizCopy, isSaving } = useQuizCopySave();
  const { triggerN8nWorkflow } = useN8nIntegration();
  const navigate = useNavigate();

  const handleSelectQuiz = (quizType: string) => {
    setSelectedQuizType(quizType);
    setCurrentStep('quiz');
  };

  const handleQuizComplete = async (answers: Record<string, string>) => {
    console.log('Quiz completed with answers:', answers);
    console.log('User:', user);
    console.log('Selected quiz type:', selectedQuizType);
    
    // Verificar se o usuário está autenticado
    if (!user?.id) {
      toast.error('Você precisa estar logado para gerar copy. Redirecionando...');
      navigate('/auth');
      return;
    }

    setQuizAnswers(answers);
    setIsGenerating(true);
    
    try {
      console.log('Generating copy with N8n integration...');
      console.log('User ID:', user.id);
      
      // Construir prompt baseado nas respostas do quiz
      const prompt = buildQuizPrompt(answers, selectedQuizType);
      console.log('Built prompt:', prompt);
      
      const result = await triggerN8nWorkflow({
        type: 'copy_generation',
        user_id: user.id,
        data: {
          copy_type: selectedQuizType,
          prompt,
          briefing: answers,
          quiz_answers: answers
        },
        workflow_id: 'quiz-copy-generation',
        session_id: `quiz_${selectedQuizType}_${Date.now()}`
      });

      console.log('N8n result:', result);
      
      if (!result || !result.generatedCopy) {
        throw new Error('Nenhuma copy foi gerada');
      }

      const copy = {
        title: getQuizTitle(selectedQuizType),
        content: result.generatedCopy
      };
      
      console.log('Copy generated successfully:', copy);
      setGeneratedCopy(copy);
      setCurrentStep('result');
      
      // Salvar automaticamente no histórico
      if (copy) {
        try {
          const savedCopy = await saveQuizCopy({
            quizType: selectedQuizType,
            quizAnswers: answers,
            generatedCopy: copy
          });
          
          if (savedCopy) {
            setSavedCopyId(savedCopy.id);
            console.log('Copy saved to history with ID:', savedCopy.id);
          }
        } catch (saveError) {
          console.error('Erro ao salvar no histórico:', saveError);
          // Não bloquear o fluxo se o salvamento falhar
        }
      }
      
      toast.success('Copy gerada com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar copy:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      if (errorMessage.includes('Tokens insuficientes')) {
        toast.error('Tokens insuficientes para gerar copy. Verifique seus créditos.');
      } else if (errorMessage.includes('User ID é obrigatório')) {
        toast.error('Erro de autenticação. Faça login novamente.');
        navigate('/auth');
      } else {
        toast.error(`Erro ao gerar copy: ${errorMessage}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const buildQuizPrompt = (answers: Record<string, string>, quizType: string): string => {
    const answersText = Object.entries(answers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const typePrompts = {
      vsl: `Crie um roteiro completo de VSL (Video Sales Letter) baseado nas seguintes informações:\n\n${answersText}\n\nEstruture em: Hook, Desenvolvimento (problema/agitação/solução), Oferta e CTA final.`,
      product: `Crie uma estrutura de oferta completa baseada nas seguintes informações:\n\n${answersText}\n\nInclua: Proposta de valor, benefícios, bônus, garantia e urgência.`,
      landing: `Crie uma copy completa para landing page baseada nas seguintes informações:\n\n${answersText}\n\nInclua: Headline, subheadline, benefícios, prova social e CTA.`,
      ads: `Crie múltiplas variações de anúncios pagos baseado nas seguintes informações:\n\n${answersText}\n\nGere pelo menos 3 variações com diferentes abordagens.`
    };

    return typePrompts[quizType as keyof typeof typePrompts] || 
           `Crie uma copy profissional baseada nas seguintes informações:\n\n${answersText}`;
  };

  const getQuizTitle = (quizType: string): string => {
    const titles = {
      vsl: 'Roteiro de Vídeo de Vendas (VSL)',
      product: 'Estrutura de Oferta',
      landing: 'Copy de Landing Page',
      ads: 'Anúncios Pagos'
    };
    return titles[quizType as keyof typeof titles] || 'Copy Personalizada';
  };

  const handleBackToSelector = () => {
    setCurrentStep('selector');
    setSelectedQuizType('');
    setGeneratedCopy(null);
    setQuizAnswers({});
    setSavedCopyId(null);
  };

  const handleBackToQuiz = () => {
    setCurrentStep('quiz');
    setGeneratedCopy(null);
    setSavedCopyId(null);
  };

  const handleCopyToClipboard = () => {
    if (generatedCopy) {
      navigator.clipboard.writeText(generatedCopy.content);
      toast.success('Copy copiada para a área de transferência!');
    }
  };

  const handleDownload = () => {
    if (generatedCopy) {
      const element = document.createElement('a');
      const file = new Blob([generatedCopy.content], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `${generatedCopy.title.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const handleViewInHistory = () => {
    navigate('/history');
    toast.success('Navegando para o histórico...');
  };

  // Verificar se o usuário está logado antes de mostrar o quiz
  if (!user) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto text-center py-16">
          <div className="bg-[#1E1E1E] border border-[#4B5563]/20 rounded-lg p-8">
            <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Login Necessário
            </h2>
            <p className="text-[#CCCCCC] mb-6">
              Você precisa estar logado para usar o gerador de copy com quiz.
            </p>
            <Button
              onClick={() => navigate('/auth')}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
            >
              Fazer Login
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (currentStep === 'selector') {
    return (
      <DashboardLayout>
        <QuizSelector onSelectQuiz={handleSelectQuiz} />
      </DashboardLayout>
    );
  }

  if (currentStep === 'quiz') {
    return (
      <DashboardLayout>
        <QuizFlow
          quizType={selectedQuizType}
          onComplete={handleQuizComplete}
          onBack={handleBackToSelector}
          isLoading={isGenerating}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              🎉 Sua Copy Está Pronta!
            </h1>
            <p className="text-[#CCCCCC]">
              Copy personalizada gerada com IA
              {savedCopyId && (
                <span className="ml-2 text-[#3B82F6]">
                  • Salva no histórico ✓
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleBackToQuiz}
              className="border-[#4B5563] text-white hover:bg-[#2A2A2A]"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Refazer Quiz
            </Button>
            <Button
              variant="outline"
              onClick={handleBackToSelector}
              className="border-[#4B5563] text-white hover:bg-[#2A2A2A]"
            >
              Novo Quiz
            </Button>
          </div>
        </div>

        {/* Result Card */}
        <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
          <CardHeader>
            <CardTitle className="text-white text-xl flex items-center gap-3">
              <Copy className="w-6 h-6 text-[#3B82F6]" />
              {generatedCopy?.title}
            </CardTitle>
            <CardDescription className="text-[#CCCCCC]">
              Sua copy personalizada baseada no quiz respondido
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Copy Content */}
            <div className="bg-[#2A2A2A] rounded-lg p-6 border border-[#4B5563]/20">
              <pre className="text-white text-sm leading-relaxed whitespace-pre-wrap font-['Inter']">
                {generatedCopy?.content}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#4B5563]/20">
              <Button
                onClick={handleCopyToClipboard}
                className="bg-[#3B82F6] hover:bg-[#2563EB] text-white flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar para Área de Transferência
              </Button>
              
              <Button
                onClick={handleDownload}
                variant="outline"
                className="border-[#4B5563] text-white hover:bg-[#2A2A2A] flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar como TXT
              </Button>

              {savedCopyId && (
                <Button
                  onClick={handleViewInHistory}
                  variant="outline"
                  className="border-[#3B82F6] text-[#3B82F6] hover:bg-[#3B82F6]/10 flex-1"
                >
                  <History className="w-4 h-4 mr-2" />
                  Ver no Histórico
                </Button>
              )}
            </div>

            {/* Save Status */}
            {user && (
              <div className="bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#3B82F6]"></div>
                  <div>
                    <h4 className="text-[#3B82F6] font-medium">
                      {savedCopyId ? 'Copy salva automaticamente!' : 'Salvando copy...'}
                    </h4>
                    <p className="text-[#CCCCCC] text-sm">
                      {savedCopyId 
                        ? 'Sua copy foi salva no histórico e pode ser acessada a qualquer momento.'
                        : 'Aguarde enquanto salvamos sua copy no histórico...'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded-lg p-4">
              <h4 className="text-[#3B82F6] font-medium mb-2">💡 Dicas para usar sua copy:</h4>
              <ul className="text-[#CCCCCC] text-sm space-y-1">
                <li>• Personalize os textos com informações específicas do seu negócio</li>
                <li>• Teste diferentes variações para ver qual converte melhor</li>
                <li>• Acompanhe as métricas de performance sugeridas</li>
                <li>• Faça ajustes baseados nos resultados obtidos</li>
              </ul>
            </div>

            {/* Next Steps */}
            <div className="text-center">
              <p className="text-[#888888] text-sm mb-4">
                Quer criar outro tipo de copy para completar sua estratégia?
              </p>
              <Button
                onClick={handleBackToSelector}
                variant="outline"
                className="border-[#4B5563] text-white hover:bg-[#2A2A2A]"
              >
                Fazer Outro Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Quiz;
