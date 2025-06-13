
import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Copy, Edit, ArrowRight, TrendingUp, Users, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { state } = useApp();
  const { toast } = useToast();

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: `${type} copiado para a área de transferência.`,
    });
  };

  if (!state.currentProject) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md mx-auto text-center bg-[#1E1E1E] border-[#4B5563]/20">
          <CardHeader>
            <CardTitle className="text-white">Nenhum projeto encontrado</CardTitle>
            <CardDescription className="text-[#CCCCCC]">
              Comece criando seu primeiro projeto respondendo nosso quiz estratégico.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="bg-[#3B82F6] hover:bg-[#2563EB] text-white">
              <Link to="/quiz">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Projeto
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const project = state.currentProject;

  // Simulate metrics
  const metrics = [
    {
      title: 'CTR Estimado',
      value: '3.2%',
      change: '+12%',
      icon: TrendingUp,
      description: 'Click-through rate esperado'
    },
    {
      title: 'Alcance Potencial',
      value: '45.2K',
      change: '+8%',
      icon: Users,
      description: 'Pessoas que podem ver seu anúncio'
    },
    {
      title: 'Score de Conversão',
      value: '8.5/10',
      change: '+15%',
      icon: Target,
      description: 'Potencial de conversão da copy'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
          <p className="text-[#CCCCCC]">
            Criado em {project.createdAt.toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" asChild className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A] hover:text-white">
            <Link to="/quiz">
              <Plus className="w-4 h-4 mr-2" />
              Novo Projeto
            </Link>
          </Button>
          <Button variant="outline" asChild className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A] hover:text-white">
            <Link to="/tools">
              Ferramentas
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid md:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index} className="bg-[#1E1E1E] border-[#4B5563]/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-[#CCCCCC]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metric.value}</div>
              <p className="text-xs text-[#CCCCCC]">
                <span className="text-green-500">{metric.change}</span> vs. média do mercado
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Project Summary */}
      <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
        <CardHeader>
          <CardTitle className="text-white">Resumo do Projeto</CardTitle>
          <CardDescription className="text-[#CCCCCC]">
            Informações baseadas no seu questionário estratégico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2 text-white">Produto/Serviço:</h4>
              <p className="text-[#CCCCCC] mb-4">{project.answers.product}</p>
              
              <h4 className="font-semibold mb-2 text-white">Público-alvo:</h4>
              <p className="text-[#CCCCCC] mb-4">{project.answers.target}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-white">Principal benefício:</h4>
              <p className="text-[#CCCCCC] mb-4">{project.answers.benefit}</p>
              
              <h4 className="font-semibold mb-2 text-white">Diferencial único:</h4>
              <p className="text-[#CCCCCC]">{project.answers.differential}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated Content */}
      <Tabs defaultValue="ad" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-[#1E1E1E] border-[#4B5563]/20">
          <TabsTrigger value="ad" className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white text-[#CCCCCC]">Copy do Anúncio</TabsTrigger>
          <TabsTrigger value="video" className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white text-[#CCCCCC]">Roteiro de Vídeo</TabsTrigger>
        </TabsList>

        <TabsContent value="ad">
          <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Copy do Anúncio</CardTitle>
                  <CardDescription className="text-[#CCCCCC]">
                    Copy otimizada para redes sociais e anúncios pagos
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(project.adCopy, 'Copy do anúncio')}
                    className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A] hover:text-white"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </Button>
                  <Button variant="outline" size="sm" className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A] hover:text-white">
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-[#2A2A2A] p-4 rounded-lg whitespace-pre-wrap font-mono text-sm text-[#CCCCCC]">
                {project.adCopy}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="video">
          <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Roteiro de Vídeo</CardTitle>
                  <CardDescription className="text-[#CCCCCC]">
                    Script completo para vídeo de vendas ou anúncio
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(project.videoScript, 'Roteiro de vídeo')}
                    className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A] hover:text-white"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </Button>
                  <Button variant="outline" size="sm" className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A] hover:text-white">
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-[#2A2A2A] p-4 rounded-lg whitespace-pre-wrap font-mono text-sm max-h-96 overflow-y-auto text-[#CCCCCC]">
                {project.videoScript}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Next Steps */}
      <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
        <CardHeader>
          <CardTitle className="text-white">Próximos Passos</CardTitle>
          <CardDescription className="text-[#CCCCCC]">
            Sugestões para melhorar ainda mais suas copies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-auto p-4 text-left border-[#4B5563] hover:bg-[#2A2A2A]" asChild>
              <Link to="/tools">
                <div>
                  <h4 className="font-semibold mb-1 text-white">Explorar Ferramentas</h4>
                  <p className="text-sm text-[#CCCCCC]">
                    Use nosso gerador de headlines e gatilhos mentais
                  </p>
                </div>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 text-left border-[#4B5563] hover:bg-[#2A2A2A]" asChild>
              <Link to="/quiz">
                <div>
                  <h4 className="font-semibold mb-1 text-white">Criar Variação A/B</h4>
                  <p className="text-sm text-[#CCCCCC]">
                    Teste diferentes abordagens para o mesmo produto
                  </p>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
