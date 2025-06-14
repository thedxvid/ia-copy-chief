
import React, { createContext, useContext } from 'react';
import { useTutorial } from '@/hooks/useTutorial';

interface TutorialContextType {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  isCompleted: boolean;
  isSkipped: boolean;
  isLoading: boolean;
  startTutorial: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  resetTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const tutorial = useTutorial();
  
  return (
    <TutorialContext.Provider value={tutorial}>
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorialContext = () => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorialContext must be used within a TutorialProvider');
  }
  return context;
};
