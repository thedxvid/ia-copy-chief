
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>Nenhum projeto encontrado</CardTitle>
            <CardDescription>
              Comece criando seu primeiro projeto respondendo nosso quiz estratégico.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
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
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
            <p className="text-muted-foreground">
              Criado em {project.createdAt.toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button variant="outline" asChild>
              <Link to="/quiz">
                <Plus className="w-4 h-4 mr-2" />
                Novo Projeto
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/tools">
                Ferramentas
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <metric.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{metric.change}</span> vs. média do mercado
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Project Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Resumo do Projeto</CardTitle>
            <CardDescription>
              Informações baseadas no seu questionário estratégico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Produto/Serviço:</h4>
                <p className="text-muted-foreground mb-4">{project.answers.product}</p>
                
                <h4 className="font-semibold mb-2">Público-alvo:</h4>
                <p className="text-muted-foreground mb-4">{project.answers.target}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Principal benefício:</h4>
                <p className="text-muted-foreground mb-4">{project.answers.benefit}</p>
                
                <h4 className="font-semibold mb-2">Diferencial único:</h4>
                <p className="text-muted-foreground">{project.answers.differential}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generated Content */}
        <Tabs defaultValue="ad" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ad">Copy do Anúncio</TabsTrigger>
            <TabsTrigger value="video">Roteiro de Vídeo</TabsTrigger>
          </TabsList>

          <TabsContent value="ad">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Copy do Anúncio</CardTitle>
                    <CardDescription>
                      Copy otimizada para redes sociais e anúncios pagos
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(project.adCopy, 'Copy do anúncio')}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap font-mono text-sm">
                  {project.adCopy}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="video">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Roteiro de Vídeo</CardTitle>
                    <CardDescription>
                      Script completo para vídeo de vendas ou anúncio
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(project.videoScript, 'Roteiro de vídeo')}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap font-mono text-sm max-h-96 overflow-y-auto">
                  {project.videoScript}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Next Steps */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Próximos Passos</CardTitle>
            <CardDescription>
              Sugestões para melhorar ainda mais suas copies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Button variant="outline" className="h-auto p-4 text-left" asChild>
                <Link to="/tools">
                  <div>
                    <h4 className="font-semibold mb-1">Explorar Ferramentas</h4>
                    <p className="text-sm text-muted-foreground">
                      Use nosso gerador de headlines e gatilhos mentais
                    </p>
                  </div>
                </Link>
              </Button>
              
              <Button variant="outline" className="h-auto p-4 text-left" asChild>
                <Link to="/quiz">
                  <div>
                    <h4 className="font-semibold mb-1">Criar Variação A/B</h4>
                    <p className="text-sm text-muted-foreground">
                      Teste diferentes abordagens para o mesmo produto
                    </p>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
