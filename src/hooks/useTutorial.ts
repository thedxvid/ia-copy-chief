
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TutorialState {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  isCompleted: boolean;
  isSkipped: boolean;
}

export const useTutorial = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tutorialState, setTutorialState] = useState<TutorialState>({
    isActive: false,
    currentStep: 0,
    totalSteps: 6,
    isCompleted: false,
    isSkipped: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Carregar estado do tutorial do banco de dados
  const loadTutorialState = useCallback(async () => {
    if (!user) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('tutorial_completed, tutorial_skipped, tutorial_step')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Erro ao carregar estado do tutorial:', error);
        return;
      }

      if (profile) {
        const shouldShowTutorial = !profile.tutorial_completed && !profile.tutorial_skipped;
        setTutorialState({
          isActive: shouldShowTutorial,
          currentStep: profile.tutorial_step || 0,
          totalSteps: 6,
          isCompleted: profile.tutorial_completed || false,
          isSkipped: profile.tutorial_skipped || false,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar tutorial:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Atualizar estado no banco de dados
  const updateTutorialInDB = useCallback(async (updates: Partial<{
    tutorial_completed: boolean;
    tutorial_skipped: boolean;
    tutorial_step: number;
  }>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        console.error('Erro ao atualizar tutorial:', error);
      }
    } catch (error) {
      console.error('Erro ao atualizar tutorial:', error);
    }
  }, [user]);

  // Iniciar tutorial
  const startTutorial = useCallback(() => {
    setTutorialState(prev => ({
      ...prev,
      isActive: true,
      currentStep: 0,
    }));
    updateTutorialInDB({ tutorial_step: 0 });
  }, [updateTutorialInDB]);

  // Próximo step
  const nextStep = useCallback(() => {
    setTutorialState(prev => {
      const newStep = prev.currentStep + 1;
      if (newStep >= prev.totalSteps) {
        // Tutorial completo
        updateTutorialInDB({ 
          tutorial_completed: true, 
          tutorial_step: newStep 
        });
        toast({
          title: "Tutorial Concluído! 🎉",
          description: "Você já pode explorar todas as funcionalidades da plataforma.",
        });
        return {
          ...prev,
          isActive: false,
          currentStep: newStep,
          isCompleted: true,
        };
      } else {
        updateTutorialInDB({ tutorial_step: newStep });
        return {
          ...prev,
          currentStep: newStep,
        };
      }
    });
  }, [updateTutorialInDB, toast]);

  // Step anterior
  const previousStep = useCallback(() => {
    setTutorialState(prev => {
      const newStep = Math.max(0, prev.currentStep - 1);
      updateTutorialInDB({ tutorial_step: newStep });
      return {
        ...prev,
        currentStep: newStep,
      };
    });
  }, [updateTutorialInDB]);

  // Pular tutorial
  const skipTutorial = useCallback(() => {
    setTutorialState(prev => ({
      ...prev,
      isActive: false,
      isSkipped: true,
    }));
    updateTutorialInDB({ tutorial_skipped: true });
    toast({
      title: "Tutorial Pulado",
      description: "Você pode reativar o tutorial nas configurações do seu perfil.",
    });
  }, [updateTutorialInDB, toast]);

  // Completar tutorial (não quero ver mais)
  const completeTutorial = useCallback(() => {
    setTutorialState(prev => ({
      ...prev,
      isActive: false,
      isCompleted: true,
    }));
    updateTutorialInDB({ tutorial_completed: true });
    toast({
      title: "Tutorial Concluído",
      description: "O tutorial não será mais exibido.",
    });
  }, [updateTutorialInDB, toast]);

  // Resetar tutorial (para configurações)
  const resetTutorial = useCallback(() => {
    setTutorialState({
      isActive: true,
      currentStep: 0,
      totalSteps: 6,
      isCompleted: false,
      isSkipped: false,
    });
    updateTutorialInDB({ 
      tutorial_completed: false, 
      tutorial_skipped: false, 
      tutorial_step: 0 
    });
  }, [updateTutorialInDB]);

  useEffect(() => {
    loadTutorialState();
  }, [loadTutorialState]);

  return {
    ...tutorialState,
    isLoading,
    startTutorial,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
    resetTutorial,
  };
};
