
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, FileText, MessageSquare, Target } from 'lucide-react';
import { ToolModal } from '@/components/tools/ToolModal';
import { CopyPlayground } from '@/components/tools/CopyPlayground';
import { useTokens } from '@/hooks/useTokens';

const Tools = () => {
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const { tokens } = useTokens();

  const tools = [
    {
      icon: Zap,
      title: "Gerador de Headlines",
      description: "Crie headlines impactantes que chamam atenção",
      color: "bg-[#3B82F6]",
      type: "headlines",
      estimatedTokens: 500
    },
    {
      icon: FileText,
      title: "Copy para Anúncios",
      description: "Gere copies persuasivas para suas campanhas",
      color: "bg-[#10B981]",
      type: "ads",
      estimatedTokens: 1000
    },
    {
      icon: MessageSquare,
      title: "Scripts de Vendas",
      description: "Roteiros otimizados para conversão",
      color: "bg-[#F59E0B]",
      type: "sales",
      estimatedTokens: 2000
    },
    {
      icon: Target,
      title: "CTAs Poderosos",
      description: "Calls-to-action que geram mais cliques",
      color: "bg-[#EF4444]",
      type: "cta",
      estimatedTokens: 300
    }
  ];

  const handleToolClick = (tool: any) => {
    setSelectedTool(tool);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Ferramentas de Copy</h1>
        <p className="text-[#CCCCCC]">
          Utilize nossas ferramentas especializadas para criar copies de alta conversão
        </p>
        <div className="mt-4 text-sm text-[#CCCCCC]">
          Tokens disponíveis: {tokens?.total_available?.toLocaleString() || 0}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {tools.map((tool, index) => (
          <Card key={index} className="bg-[#1E1E1E] border-[#4B5563]/20 hover:border-[#4B5563]/40 transition-colors">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 ${tool.color} rounded-xl flex items-center justify-center`}>
                  <tool.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-white">{tool.title}</CardTitle>
                  <CardDescription className="text-[#CCCCCC]">
                    {tool.description}
                  </CardDescription>
                  <div className="text-xs text-[#CCCCCC] mt-1">
                    ~{tool.estimatedTokens} tokens
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => handleToolClick(tool)}
                className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white"
              >
                Usar Ferramenta
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <CopyPlayground />

      {selectedTool && (
        <ToolModal
          isOpen={!!selectedTool}
          onClose={() => setSelectedTool(null)}
          tool={selectedTool}
        />
      )}
    </div>
  );
};

export default Tools;
