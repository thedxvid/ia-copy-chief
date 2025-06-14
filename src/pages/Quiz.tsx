
import React, { useState } from 'react';
import { QuizSelector } from '@/components/quiz/QuizSelector';
import { QuizFlow } from '@/components/quiz/QuizFlow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateCopyWithN8n } from '@/utils/copyGenerators';
import { useAuth } from '@/contexts/AuthContext';
import { useQuizCopySave } from '@/hooks/useQuizCopySave';
import { Copy, Download, RotateCcw, History } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Quiz = () => {
  const [currentStep, setCurrentStep] = useState<'selector' | 'quiz' | 'result'>('selector');
  const [selectedQuizType, setSelectedQuizType] = useState<string>('');
  const [generatedCopy, setGeneratedCopy] = useState<{ title: string; content: string } | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedCopyId, setSavedCopyId] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { saveQuizCopy, isSaving } = useQuizCopySave();
  const navigate = useNavigate();

  const handleSelectQuiz = (quizType: string) => {
    setSelectedQuizType(quizType);
    setCurrentStep('quiz');
  };

  const handleQuizComplete = async (answers: Record<string, string>) => {
    console.log('Quiz completed with answers:', answers);
    setQuizAnswers(answers);
    setIsGenerating(true);
    
    try {
      console.log('Generating copy with Claude via N8n...');
      
      const copy = await generateCopyWithN8n(answers, selectedQuizType, user?.id);
      
      console.log('Copy generated successfully:', copy);
      setGeneratedCopy(copy);
      setCurrentStep('result');
      
      // Salvar automaticamente no histórico se o usuário estiver logado
      if (user?.id && copy) {
        try {
          const savedCopy = await saveQuizCopy({
            quizType: selectedQuizType,
            quizAnswers: answers,
            generatedCopy: copy
          });
          
          if (savedCopy) {
            setSavedCopyId(savedCopy.id);
          }
        } catch (saveError) {
          console.error('Erro ao salvar no histórico:', saveError);
          // Não bloquear o fluxo se o salvamento falhar
        }
      }
      
      toast.success('Copy gerada com sucesso usando Claude AI!');
    } catch (error) {
      console.error('Erro ao gerar copy:', error);
      toast.error('Erro ao gerar copy. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
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

  if (currentStep === 'selector') {
    return (
      <div className="min-h-screen bg-[#121212] text-white font-['Inter'] p-6">
        <QuizSelector onSelectQuiz={handleSelectQuiz} />
      </div>
    );
  }

  if (currentStep === 'quiz') {
    return (
      <div className="min-h-screen bg-[#121212] text-white font-['Inter'] p-6">
        <QuizFlow
          quizType={selectedQuizType}
          onComplete={handleQuizComplete}
          onBack={handleBackToSelector}
          isLoading={isGenerating}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white font-['Inter'] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              🎉 Sua Copy Está Pronta!
            </h1>
            <p className="text-[#CCCCCC]">
              Copy personalizada gerada com Claude AI via N8n
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
    </div>
  );
};

export default Quiz;
