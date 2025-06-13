
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Zap, FileText, MessageSquare, Target } from 'lucide-react';

const Tools = () => {
  const tools = [
    {
      icon: Zap,
      title: "Gerador de Headlines",
      description: "Crie headlines impactantes que chamam atenção",
      color: "bg-[#3B82F6]"
    },
    {
      icon: FileText,
      title: "Copy para Anúncios",
      description: "Gere copies persuasivas para suas campanhas",
      color: "bg-[#10B981]"
    },
    {
      icon: MessageSquare,
      title: "Scripts de Vendas",
      description: "Roteiros otimizados para conversão",
      color: "bg-[#F59E0B]"
    },
    {
      icon: Target,
      title: "CTAs Poderosos",
      description: "Calls-to-action que geram mais cliques",
      color: "bg-[#EF4444]"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Ferramentas de Copy</h1>
        <p className="text-[#CCCCCC]">
          Utilize nossas ferramentas especializadas para criar copies de alta conversão
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {tools.map((tool, index) => (
          <Card key={index} className="bg-[#1E1E1E] border-[#4B5563]/20 hover:border-[#4B5563]/40 transition-colors">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 ${tool.color} rounded-xl flex items-center justify-center`}>
                  <tool.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">{tool.title}</CardTitle>
                  <CardDescription className="text-[#CCCCCC]">
                    {tool.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white">
                Usar Ferramenta
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
        <CardHeader>
          <CardTitle className="text-white">Playground de Copy</CardTitle>
          <CardDescription className="text-[#CCCCCC]">
            Experimente e refine suas copies em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea 
            placeholder="Digite sua copy aqui..."
            className="min-h-32 bg-[#2A2A2A] border-[#4B5563]/40 text-white placeholder:text-[#CCCCCC]"
          />
          <div className="flex gap-2">
            <Button className="bg-[#3B82F6] hover:bg-[#2563EB] text-white">
              Analisar Copy
            </Button>
            <Button variant="outline" className="border-[#4B5563] text-white hover:bg-[#2A2A2A]">
              Sugerir Melhorias
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Tools;
