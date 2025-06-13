
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { QuizQuestion, getQuizQuestions, getQuizTitle } from '@/data/quizQuestions';

interface QuizFlowProps {
  quizType: string;
  onComplete: (answers: Record<string, string>) => void;
  onBack: () => void;
}

export const QuizFlow: React.FC<QuizFlowProps> = ({ quizType, onComplete, onBack }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState('');

  const questions = getQuizQuestions(quizType);
  const quizTitle = getQuizTitle(quizType);
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleNext = () => {
    if (currentAnswer.trim() || !questions[currentQuestion].required) {
      const newAnswers = { ...answers };
      newAnswers[questions[currentQuestion].id] = currentAnswer;
      setAnswers(newAnswers);
      
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setCurrentAnswer(newAnswers[questions[currentQuestion + 1]?.id] || '');
      } else {
        onComplete(newAnswers);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setCurrentAnswer(answers[questions[currentQuestion - 1].id] || '');
    }
  };

  const handleAnswerChange = (value: string) => {
    setCurrentAnswer(value);
  };

  const renderQuestionInput = (question: QuizQuestion) => {
    switch (question.type) {
      case 'radio':
        return (
          <RadioGroup value={currentAnswer} onValueChange={handleAnswerChange}>
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-[#2A2A2A] transition-colors">
                <RadioGroupItem 
                  value={option} 
                  id={`option-${index}`}
                  className="border-[#4B5563] text-[#3B82F6]"
                />
                <Label 
                  htmlFor={`option-${index}`} 
                  className="text-white cursor-pointer flex-1 text-base"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
        
      case 'textarea':
        return (
          <Textarea
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder={question.placeholder}
            className="min-h-[120px] bg-[#2A2A2A] border-[#4B5563] text-white placeholder:text-[#888888] text-base"
          />
        );
        
      case 'text':
        return (
          <Input
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder={question.placeholder}
            className="bg-[#2A2A2A] border-[#4B5563] text-white placeholder:text-[#888888] text-base"
          />
        );
        
      case 'number':
        return (
          <Input
            type="number"
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder={question.placeholder}
            className="bg-[#2A2A2A] border-[#4B5563] text-white placeholder:text-[#888888] text-base"
          />
        );
        
      default:
        return null;
    }
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-white mb-4">Quiz não encontrado</h2>
        <Button onClick={onBack} variant="outline">
          Voltar à seleção
        </Button>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const isAnswered = currentAnswer.trim() !== '';
  const canProceed = !currentQ.required || isAnswered;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-[#CCCCCC] hover:text-white hover:bg-[#2A2A2A]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{quizTitle}</h1>
          <p className="text-[#CCCCCC]">
            Pergunta {currentQuestion + 1} de {questions.length}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[#CCCCCC]">Progresso</span>
          <span className="text-sm text-[#CCCCCC]">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
        <CardHeader>
          <CardTitle className="text-white text-xl leading-relaxed">
            {currentQ.question}
            {currentQ.required && <span className="text-red-400 ml-1">*</span>}
          </CardTitle>
          {currentQ.type === 'radio' && (
            <CardDescription className="text-[#CCCCCC]">
              Selecione a opção que melhor descreve sua situação
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          {renderQuestionInput(currentQ)}
          
          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-[#4B5563]/20">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="border-[#4B5563] text-white hover:bg-[#2A2A2A]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
            
            <div className="text-center">
              <div className="text-sm text-[#888888]">
                {currentQuestion + 1} / {questions.length}
              </div>
            </div>
            
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
            >
              {currentQuestion === questions.length - 1 ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Finalizar
                </>
              ) : (
                <>
                  Próxima
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Help text */}
      <div className="text-center text-[#888888] text-sm">
        💡 Responda com o máximo de detalhes possível para obter copies mais precisas
      </div>
    </div>
  );
};
