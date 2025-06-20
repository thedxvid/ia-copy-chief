
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, ChevronLeft, ChevronRight, SkipForward, EyeOff } from 'lucide-react';
import { TutorialProgress } from './TutorialProgress';
import { TutorialSpotlight } from './TutorialSpotlight';
import { TutorialPointer } from './TutorialPointer';
import { useTutorialContext } from '@/contexts/TutorialContext';
import { useTutorialPositioning } from '@/hooks/useTutorialPositioning';
import { tutorialSteps } from '@/data/tutorialSteps';

export const TutorialOverlay: React.FC = () => {
  const {
    isActive,
    currentStep,
    totalSteps,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
  } = useTutorialContext();

  const currentStepData = tutorialSteps[currentStep];
  const { modalPosition, recalculate } = useTutorialPositioning(
    currentStepData?.highlightElement
  );

  // Recalcular posições quando step mudar
  useEffect(() => {
    if (isActive && currentStepData?.highlightElement) {
      const timer = setTimeout(() => {
        recalculate();
      }, 100); // Pequeno delay para garantir que DOM foi atualizado
      
      return () => clearTimeout(timer);
    }
  }, [currentStep, isActive, currentStepData?.highlightElement, recalculate]);

  // Navegação por teclado
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          skipTutorial();
          break;
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          nextStep();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (currentStep > 0) previousStep();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, currentStep, nextStep, previousStep, skipTutorial]);

  if (!isActive || !currentStepData) {
    return null;
  }

  const IconComponent = currentStepData.icon;
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  const modalStyle = modalPosition.position === 'center'
    ? {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10001
      }
    : {
        position: 'fixed' as const,
        top: modalPosition.top,
        left: modalPosition.left,
        zIndex: 10001
      };

  return (
    <>
      <TutorialSpotlight
        targetElement={currentStepData.highlightElement}
        isActive={isActive}
      />
      
      {/* Modal dinâmico */}
      <div style={modalStyle}>
        <Card className="w-full max-w-lg bg-[#1E1E1E] border-[#4B5563] text-white relative animate-fade-in">
          <TutorialPointer 
            modalPosition={modalPosition} 
            targetElement={currentStepData.highlightElement} 
          />
          
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#3B82F6] rounded-lg flex items-center justify-center">
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
                  <p className="text-sm text-[#CCCCCC]">{currentStepData.description}</p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={skipTutorial}
                className="text-[#888888] hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <p className="text-[#CCCCCC] leading-relaxed">
              {currentStepData.content}
            </p>

            <TutorialProgress 
              currentStep={currentStep} 
              totalSteps={totalSteps} 
            />

            {/* Navegação - Layout responsivo melhorado */}
            <div className="space-y-3">
              {/* Botões principais de navegação */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={previousStep}
                  disabled={isFirstStep}
                  className="border-[#4B5563] text-white hover:bg-[#2A2A2A] disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>

                <Button
                  onClick={nextStep}
                  className="bg-[#3B82F6] hover:bg-[#2563EB] text-white flex-1"
                >
                  {isLastStep ? (
                    <>
                      Começar
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  ) : (
                    <>
                      Próximo
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>

              {/* Botões secundários */}
              <div className="flex gap-2 justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipTutorial}
                  className="text-[#888888] hover:text-white hover:bg-[#2A2A2A] text-xs"
                >
                  <SkipForward className="w-3 h-3 mr-1" />
                  Pular
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={completeTutorial}
                  className="text-[#888888] hover:text-white hover:bg-[#2A2A2A] text-xs"
                >
                  <EyeOff className="w-3 h-3 mr-1" />
                  Não mostrar mais
                </Button>
              </div>
            </div>

            {/* Dica de navegação */}
            <div className="text-xs text-[#888888] text-center">
              💡 Use as setas do teclado para navegar ou ESC para sair
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};
