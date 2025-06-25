
import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayCircle } from 'lucide-react';

const Tutorial: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <PlayCircle className="w-8 h-8 text-[#3B82F6]" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Tutorial</h1>
            <p className="text-[#CCCCCC] mt-1">
              Aprenda como usar a plataforma CopyChief de forma eficiente
            </p>
          </div>
        </div>

        <Card className="bg-[#1E1E1E] border-[#4B5563]">
          <CardHeader>
            <CardTitle className="text-white">Vídeo Tutorial</CardTitle>
            <CardDescription>
              Assista ao tutorial completo para dominar todas as funcionalidades da plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe 
                className="absolute inset-0 w-full h-full rounded-lg"
                src="https://www.youtube-nocookie.com/embed/NuT90jBfN68?si=LQWMlgfnlduJgaGD&controls=1" 
                title="Tutorial CopyChief - Como usar a plataforma"
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                referrerPolicy="strict-origin-when-cross-origin" 
                allowFullScreen
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-[#4B5563]">
          <CardHeader>
            <CardTitle className="text-white">Tópicos Abordados</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-[#CCCCCC]">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#3B82F6] rounded-full"></div>
                Navegação pela plataforma
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#3B82F6] rounded-full"></div>
                Como usar o Chat IA
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#3B82F6] rounded-full"></div>
                Gerenciamento de tokens
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#3B82F6] rounded-full"></div>
                Ferramentas especializadas
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#3B82F6] rounded-full"></div>
                Histórico e organização
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Tutorial;
