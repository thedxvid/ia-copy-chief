
import React, { useState } from 'react';
import { QuizFlow } from '@/components/quiz/QuizFlow';
import { QuizTemplateManager } from '@/components/quiz/QuizTemplateManager';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const Quiz = () => {
  const [activeTab, setActiveTab] = useState<'quiz' | 'templates'>('quiz');
  const { user } = useAuth();
  const navigate = useNavigate();

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
            <Button onClick={() => navigate('/auth')} className="bg-[#3B82F6] hover:bg-[#2563EB] text-white">
              Fazer Login
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={value => setActiveTab(value as 'quiz' | 'templates')} className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Gerador de Copy com Quiz</h1>
              <p className="text-[#CCCCCC]">
                Crie copy personalizada respondendo perguntas específicas
              </p>
            </div>
            <TabsList className="bg-[#1E1E1E] border border-[#4B5563]/20">
              <TabsTrigger value="quiz" className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white">
                Quiz
              </TabsTrigger>
              <TabsTrigger value="templates" className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white">
                <Settings className="w-4 h-4 mr-2" />
                Templates
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="quiz">
            <QuizFlow />
          </TabsContent>

          <TabsContent value="templates">
            <QuizTemplateManager />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Quiz;
