
import React, { useState } from 'react';
import { QuizSelector } from '@/components/quiz/QuizSelector';
import { QuizFlow } from '@/components/quiz/QuizFlow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateCopy } from '@/utils/copyGenerators';
import { Copy, Download, RotateCcw } from 'lucide-react';

const Quiz = () => {
  const [currentStep, setCurrentStep] = useState<'selector' | 'quiz' | 'result'>('selector');
  const [selectedQuizType, setSelectedQuizType] = useState<string>('');
  const [generatedCopy, setGeneratedCopy] = useState<{ title: string; content: string } | null>(null);

  const handleSelectQuiz = (quizType: string) => {
    setSelectedQuizType(quizType);
    setCurrentStep('quiz');
  };

  const handleQuizComplete = (answers: Record<string, string>) => {
    const copy = generateCopy(answers, selectedQuizType);
    setGeneratedCopy(copy);
    setCurrentStep('result');
  };

  const handleBackToSelector = () => {
    setCurrentStep('selector');
    setSelectedQuizType('');
    setGeneratedCopy(null);
  };

  const handleBackToQuiz = () => {
    setCurrentStep('quiz');
    setGeneratedCopy(null);
  };

  const handleCopyToClipboard = () => {
    if (generatedCopy) {
      navigator.clipboard.writeText(generatedCopy.content);
      // You could add a toast notification here
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
              Copy personalizada gerada com base nas suas respostas
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
            </div>

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
