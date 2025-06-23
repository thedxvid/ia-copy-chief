
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Package, MousePointer, Megaphone, Clock, ArrowRight, Settings, Users } from 'lucide-react';
import { ProductSelector } from '@/components/ui/product-selector';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useQuizTemplates, getQuestionsLength } from '@/hooks/useQuizTemplates';
import { useIsMobile } from '@/hooks/use-mobile';

interface QuizOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  questions: number;
  time: string;
  generates: string;
  isCustom?: boolean;
}

const standardQuizOptions: QuizOption[] = [
  {
    id: 'vsl',
    title: 'Vídeo de Vendas (VSL)',
    description: 'Crie roteiros persuasivos para seus vídeos de vendas',
    icon: Video,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/20',
    questions: 10,
    time: '5 min',
    generates: 'Roteiro completo de VSL'
  },
  {
    id: 'product',
    title: 'Estrutura de Oferta',
    description: 'Monte ofertas irresistíveis com bônus e urgência',
    icon: Package,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10 border-green-500/20',
    questions: 10,
    time: '7 min',
    generates: 'Oferta completa estruturada'
  },
  {
    id: 'landing',
    title: 'Landing Page',
    description: 'Páginas que convertem visitantes em clientes',
    icon: MousePointer,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
    questions: 10,
    time: '5 min',
    generates: 'Copy completa da página'
  },
  {
    id: 'ads',
    title: 'Anúncios Pagos',
    description: 'Anúncios que geram cliques e conversões',
    icon: Megaphone,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/20',
    questions: 10,
    time: '6 min',
    generates: 'Múltiplas variações de anúncios'
  }
];

interface QuizSelectorProps {
  onSelectQuiz: (quizType: string, productId?: string) => void;
  selectedProductId?: string;
  onProductChange?: (productId: string | undefined) => void;
}

export const QuizSelector: React.FC<QuizSelectorProps> = ({
  onSelectQuiz,
  selectedProductId,
  onProductChange
}) => {
  const { products } = useProducts();
  const { templates, isLoading: templatesLoading } = useQuizTemplates();
  const [customQuizOptions, setCustomQuizOptions] = useState<QuizOption[]>([]);
  const isMobile = useIsMobile();

  // Converter templates para opções de quiz - APENAS templates personalizados (não-padrão)
  useEffect(() => {
    if (!templatesLoading && templates) {
      // Filtrar apenas templates que são personalizados (não são padrão do sistema)
      const customTemplates = templates.filter(template => 
        template.is_active && 
        !template.is_default && // Excluir templates padrão do sistema
        template.created_by !== null // Garantir que foram criados por usuários
      );
      
      const customOptions: QuizOption[] = customTemplates.map(template => {
        const questionCount = getQuestionsLength(template.questions);
        const estimatedTime = Math.max(3, Math.ceil(questionCount * 0.7));
        
        return {
          id: `template_${template.id}`,
          title: template.title,
          description: template.description || 'Template personalizado de quiz',
          icon: Users,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10 border-yellow-500/20',
          questions: questionCount,
          time: `${estimatedTime} min`,
          generates: 'Copy personalizada baseada no template',
          isCustom: true
        };
      });
      setCustomQuizOptions(customOptions);
    }
  }, [templates, templatesLoading]);

  const handleQuizSelect = (quizType: string) => {
    console.log('🎯 [QuizSelector] Quiz selecionado:', quizType, 'Produto:', selectedProductId);
    onSelectQuiz(quizType, selectedProductId);
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
      <div className="text-center px-2">
        <h1 className="font-bold text-white mb-3 sm:mb-4 text-xl sm:text-2xl lg:text-3xl leading-tight">
          Escolha seu Quiz de Copy
        </h1>
        <p className="text-base sm:text-lg lg:text-xl text-[#CCCCCC] max-w-3xl mx-auto leading-relaxed">
          Selecione o tipo de copy que você deseja criar. Cada quiz tem perguntas específicas 
          para gerar o melhor resultado possível.
        </p>
      </div>

      <div className="w-full max-w-2xl mx-auto px-2">
        <ProductSelector 
          value={selectedProductId} 
          onValueChange={onProductChange} 
          showPreview={false} 
          placeholder="Selecione um produto para contextualizar o quiz" 
        />
        
        {selectedProduct && (
          <Alert className="bg-green-500/10 border-green-500/20 mt-3 sm:mt-4 rounded-xl sm:rounded-2xl">
            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
            <AlertDescription className="text-green-200 text-sm sm:text-base">
              ✅ Contexto ativo: O quiz será personalizado para <strong>{selectedProduct.name}</strong>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Quiz Padrões */}
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2 px-2">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-[#3B82F6] flex-shrink-0" />
            Quiz Padrões
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {standardQuizOptions.map(option => (
              <Card 
                key={option.id} 
                className={`${option.bgColor} border-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer group rounded-xl sm:rounded-2xl`} 
                onClick={() => handleQuizSelect(option.id)}
              >
                <CardHeader className="text-center pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                  <div className="mx-auto mb-3 sm:mb-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#1A1A1A] w-fit">
                    <option.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${option.color}`} />
                  </div>
                  <CardTitle className="text-white text-lg sm:text-xl group-hover:text-white transition-colors leading-tight">
                    {option.title}
                  </CardTitle>
                  <CardDescription className="text-[#CCCCCC] text-sm sm:text-base leading-relaxed">
                    {option.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="flex items-center justify-between text-xs sm:text-sm text-[#CCCCCC]">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="whitespace-nowrap">{option.questions} perguntas • {option.time}</span>
                    </div>
                  </div>
                  
                  <div className="text-xs sm:text-sm text-[#CCCCCC]">
                    <span className="font-medium text-white">Gera:</span> {option.generates}
                  </div>
                  
                  <Button 
                    className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white group-hover:bg-[#2563EB] transition-all duration-200 rounded-xl sm:rounded-2xl text-sm sm:text-base py-2 sm:py-3" 
                    onClick={e => {
                      e.stopPropagation();
                      handleQuizSelect(option.id);
                    }}
                  >
                    Começar Quiz
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Templates Personalizados - Apenas templates criados por usuários */}
        {customQuizOptions.length > 0 && (
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2 px-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />
              <span>Templates Personalizados</span>
              <span className="text-xs sm:text-sm text-[#CCCCCC] font-normal">
                ({customQuizOptions.length} criado{customQuizOptions.length !== 1 ? 's' : ''})
              </span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {customQuizOptions.map(option => (
                <Card 
                  key={option.id} 
                  className={`${option.bgColor} border-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer group rounded-xl sm:rounded-2xl`} 
                  onClick={() => handleQuizSelect(option.id)}
                >
                  <CardHeader className="text-center pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                    <div className="mx-auto mb-3 sm:mb-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#1A1A1A] w-fit">
                      <option.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${option.color}`} />
                    </div>
                    <CardTitle className="text-white text-lg sm:text-xl group-hover:text-white transition-colors leading-tight">
                      {option.title}
                    </CardTitle>
                    <CardDescription className="text-[#CCCCCC] text-sm sm:text-base leading-relaxed">
                      {option.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
                    <div className="flex items-center justify-between text-xs sm:text-sm text-[#CCCCCC]">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="whitespace-nowrap">{option.questions} perguntas • {option.time}</span>
                      </div>
                      <div className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full whitespace-nowrap">
                        Personalizado
                      </div>
                    </div>
                    
                    <div className="text-xs sm:text-sm text-[#CCCCCC]">
                      <span className="font-medium text-white">Gera:</span> {option.generates}
                    </div>
                    
                    <Button 
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-black group-hover:bg-yellow-600 transition-all duration-200 rounded-xl sm:rounded-2xl font-medium text-sm sm:text-base py-2 sm:py-3" 
                      onClick={e => {
                        e.stopPropagation();
                        handleQuizSelect(option.id);
                      }}
                    >
                      Usar Template
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Loading state para templates */}
        {templatesLoading && (
          <div className="text-center py-6 sm:py-8">
            <div className="text-[#CCCCCC] text-sm sm:text-base">Carregando templates personalizados...</div>
          </div>
        )}

        {/* Empty state para templates personalizados */}
        {!templatesLoading && customQuizOptions.length === 0 && (
          <div className="bg-[#1E1E1E] border border-[#4B5563]/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center mx-2">
            <Users className="w-10 h-10 sm:w-12 sm:h-12 text-[#4B5563] mx-auto mb-2 sm:mb-3" />
            <h3 className="text-white font-medium mb-2 text-sm sm:text-base">Nenhum template personalizado</h3>
            <p className="text-[#CCCCCC] text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
              Você ainda não criou templates personalizados de quiz.
            </p>
            <p className="text-[#888888] text-xs leading-relaxed">
              Acesse a aba "Templates" para criar seus próprios quiz personalizados.
            </p>
          </div>
        )}
      </div>

      <div className="text-center text-[#888888] text-xs sm:text-sm px-2 pb-4">
        💡 Dica: Você pode fazer todos os quiz e comparar os resultados para ter uma estratégia completa de marketing
      </div>
    </div>
  );
};
