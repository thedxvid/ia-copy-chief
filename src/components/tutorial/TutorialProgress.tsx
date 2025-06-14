
import React from 'react';

interface TutorialProgressProps {
  currentStep: number;
  totalSteps: number;
}

export const TutorialProgress: React.FC<TutorialProgressProps> = ({
  currentStep,
  totalSteps
}) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-[#CCCCCC] mb-2">
        <span>Progresso do Tutorial</span>
        <span>{currentStep + 1} de {totalSteps}</span>
      </div>
      
      <div className="w-full bg-[#2A2A2A] rounded-full h-2">
        <div
          className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="flex justify-center mt-3 space-x-2">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index <= currentStep
                ? 'bg-[#3B82F6]'
                : 'bg-[#2A2A2A]'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
