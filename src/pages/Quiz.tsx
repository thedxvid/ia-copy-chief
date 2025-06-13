
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

const Quiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState('');

  const questions = [
    {
      question: "Qual é o seu principal objetivo com copy?",
      options: ["Aumentar vendas", "Gerar leads", "Engajamento", "Awareness"]
    },
    {
      question: "Qual é o seu público-alvo?",
      options: ["B2B", "B2C", "Ambos", "Não sei"]
    },
    {
      question: "Qual tom você prefere?",
      options: ["Formal", "Casual", "Técnico", "Emocional"]
    }
  ];

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleNext = () => {
    if (selectedAnswer) {
      const newAnswers = [...answers];
      newAnswers[currentQuestion] = selectedAnswer;
      setAnswers(newAnswers);
      
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer('');
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Quiz de Personalização</h1>
        <p className="text-[#CCCCCC]">
          Responda algumas perguntas para personalizar suas copies
        </p>
      </div>

      <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-white">
              Pergunta {currentQuestion + 1} de {questions.length}
            </CardTitle>
            <span className="text-[#CCCCCC] text-sm">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>
        <CardContent className="space-y-6">
          <CardDescription className="text-[#CCCCCC] text-lg">
            {questions[currentQuestion].question}
          </CardDescription>

          <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
            {questions[currentQuestion].options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="text-white cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <Button 
            onClick={handleNext}
            disabled={!selectedAnswer}
            className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white"
          >
            {currentQuestion === questions.length - 1 ? 'Finalizar' : 'Próxima'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Quiz;
