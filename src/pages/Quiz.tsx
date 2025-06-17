
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
import { useProducts } from '@/hooks/useProducts';

const Quiz = () => {
  const [currentStep, setCurrentStep] = useState<'selector' | 'quiz' | 'result'>('selector');
  const [selectedQuizType, setSelectedQuizType] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const [generatedCopy, setGeneratedCopy] = useState<{ title: string; content: string } | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedCopyId, setSavedCopyId] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { saveQuizCopy, isSaving } = useQuizCopySave();
  const { triggerN8nWorkflow } = useN8nIntegration();
  const { fetchProductDetails } = useProducts();
  const navigate = useNavigate();

  const handleSelectQuiz = (quizType: string, productId?: string) => {
    setSelectedQuizType(quizType);
    setSelectedProductId(productId);
    setCurrentStep('quiz');
  };

  const handleProductChange = (productId: string | undefined) => {
    setSelectedProductId(productId);
  };

  const handleQuizComplete = async (answers: Record<string, string>) => {
    console.log('🎯 Quiz completed with answers:', answers);
    console.log('👤 Current user:', user);
    console.log('📝 Selected quiz type:', selectedQuizType);
    console.log('📦 Selected product ID:', selectedProductId);
    
    // Verificar se o usuário está autenticado
    if (!user?.id) {
      console.error('❌ User not authenticated');
      toast.error('Você precisa estar logado para gerar copy. Redirecionando...');
      navigate('/auth');
      return;
    }

    console.log('✅ User authenticated, proceeding with copy generation');

    setQuizAnswers(answers);
    setIsGenerating(true);
    
    try {
      // Buscar informações do produto se selecionado
      let productInfo = null;
      if (selectedProductId) {
        productInfo = await fetchProductDetails(selectedProductId);
        console.log('📦 Product info loaded:', productInfo?.name);
      }

      // Construir prompt baseado nas respostas do quiz e informações do produto
      const prompt = await buildQuizPrompt(answers, selectedQuizType, productInfo);
      console.log('📝 Built prompt for quiz:', prompt.substring(0, 200) + '...');
      
      // Preparar dados estruturados para o N8n - com tipos explícitos
      const requestData = {
        type: 'copy_generation' as const, // Explicitly typed as literal
        user_id: user.id,
        data: {
          copy_type: selectedQuizType,
          prompt,
          quiz_answers: answers,
          target_audience: answers.target || 'público geral',
          product_info: answers.product || 'produto/serviço',
          briefing: answers
        },
        workflow_id: 'quiz-copy-generation',
        session_id: `quiz_${selectedQuizType}_${Date.now()}`
      };

      console.log('🚀 Sending request to N8n integration:', JSON.stringify(requestData, null, 2));
      
      const result = await triggerN8nWorkflow(requestData);

      console.log('✅ N8n result received:', result);
      
      if (!result || !result.generatedCopy) {
        console.error('❌ Invalid result from N8n:', result);
        throw new Error('Nenhuma copy foi gerada');
      }

      const copy = {
        title: getQuizTitle(selectedQuizType),
        content: result.generatedCopy
      };
      
      console.log('🎉 Copy generated successfully:', {
        title: copy.title,
        contentLength: copy.content.length
      });
      
      setGeneratedCopy(copy);
      setCurrentStep('result');
      
      // Salvar automaticamente no histórico
      if (copy) {
        try {
          console.log('💾 Saving copy to history...');
          const savedCopy = await saveQuizCopy({
            quizType: selectedQuizType,
            quizAnswers: answers,
            generatedCopy: copy
          });
          
          if (savedCopy) {
            setSavedCopyId(savedCopy.id);
            console.log('✅ Copy saved to history with ID:', savedCopy.id);
          }
        } catch (saveError) {
          console.error('⚠️ Error saving to history:', saveError);
          // Não bloquear o fluxo se o salvamento falhar
        }
      }
      
      toast.success('Copy gerada com sucesso!');
    } catch (error) {
      console.error('💥 Error generating copy:', error);
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

  const buildQuizPrompt = async (answers: Record<string, string>, quizType: string, productInfo?: any): Promise<string> => {
    const answersText = Object.entries(answers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    let productContext = '';
    if (productInfo) {
      productContext = `
INFORMAÇÕES DO PRODUTO SELECIONADO:
- Nome: ${productInfo.name}
- Nicho: ${productInfo.niche}${productInfo.sub_niche ? ` > ${productInfo.sub_niche}` : ''}
- Status: ${productInfo.status}`;

      if (productInfo.strategy?.value_proposition) {
        productContext += `\n- Proposta de Valor: ${productInfo.strategy.value_proposition}`;
      }
      
      if (productInfo.strategy?.target_audience) {
        const audience = typeof productInfo.strategy.target_audience === 'string' 
          ? productInfo.strategy.target_audience 
          : JSON.stringify(productInfo.strategy.target_audience);
        productContext += `\n- Público-Alvo: ${audience}`;
      }

      if (productInfo.offer?.main_offer) {
        const mainOffer = typeof productInfo.offer.main_offer === 'string'
          ? productInfo.offer.main_offer
          : JSON.stringify(productInfo.offer.main_offer);
        productContext += `\n- Oferta Principal: ${mainOffer}`;
      }

      if (productInfo.offer?.pricing_strategy) {
        const pricing = typeof productInfo.offer.pricing_strategy === 'string'
          ? productInfo.offer.pricing_strategy
          : JSON.stringify(productInfo.offer.pricing_strategy);
        productContext += `\n- Estratégia de Preço: ${pricing}`;
      }
    }

    const typePrompts = {
      vsl: `Crie um roteiro completo de VSL (Video Sales Letter) baseado nas seguintes informações:

${productContext ? `${productContext}\n` : ''}
RESPOSTAS DO QUIZ:
${answersText}

Estruture em: Hook, Desenvolvimento (problema/agitação/solução), Oferta e CTA final.${productContext ? ' Use as informações do produto acima como base principal para criar um VSL personalizado e específico.' : ''}`,
      
      product: `Crie uma estrutura de oferta completa baseada nas seguintes informações:

${productContext ? `${productContext}\n` : ''}
RESPOSTAS DO QUIZ:
${answersText}

Inclua: Proposta de valor, benefícios, bônus, garantia e urgência.${productContext ? ' Use as informações do produto acima como base para criar uma oferta irresistível.' : ''}`,
      
      landing: `Crie uma copy completa para landing page baseada nas seguintes informações:

${productContext ? `${productContext}\n` : ''}
RESPOSTAS DO QUIZ:
${answersText}

Inclua: Headline, subheadline, benefícios, prova social e CTA.${productContext ? ' Use as informações do produto acima para criar uma landing page altamente convertedora.' : ''}`,
      
      ads: `Crie múltiplas variações de anúncios pagos baseado nas seguintes informações:

${productContext ? `${productContext}\n` : ''}
RESPOSTAS DO QUIZ:
${answersText}

Gere pelo menos 3 variações com diferentes abordagens.${productContext ? ' Use as informações do produto acima para criar anúncios específicos e segmentados.' : ''}`
    };

    return typePrompts[quizType as keyof typeof typePrompts] || 
           `Crie uma copy profissional baseada nas seguintes informações:

${productContext ? `${productContext}\n` : ''}
RESPOSTAS DO QUIZ:
${answersText}${productContext ? '\n\nUse as informações do produto acima como contexto principal.' : ''}`;
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
    // Manter o produto selecionado para facilitar a experiência do usuário
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-16">
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
        <QuizSelector 
          onSelectQuiz={handleSelectQuiz} 
          selectedProductId={selectedProductId}
          onProductChange={handleProductChange}
        />
      </DashboardLayout>
    );
  }

  if (currentStep === 'quiz') {
    return (
      <DashboardLayout>
        <div className="px-4 sm:px-6 lg:px-8">
          <QuizFlow
            quizType={selectedQuizType}
            productId={selectedProductId}
            onComplete={handleQuizComplete}
            onBack={handleBackToSelector}
            isLoading={isGenerating}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8 space-y-6">
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
