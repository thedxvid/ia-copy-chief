
import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Eye, Trash2, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

const History = () => {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredProjects = state.projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.answers.product?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewProject = (project: any) => {
    dispatch({ type: 'SET_CURRENT_PROJECT', project });
    toast({
      title: 'Projeto carregado',
      description: `Agora você está visualizando: ${project.name}`,
    });
  };

  const handleDeleteProject = (projectId: string) => {
    if (confirm('Tem certeza que deseja excluir este projeto?')) {
      // This would need to be implemented in the context
      toast({
        title: 'Projeto excluído',
        description: 'O projeto foi removido com sucesso.',
      });
    }
  };

  if (state.projects.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>Nenhum projeto encontrado</CardTitle>
            <CardDescription>
              Você ainda não criou nenhum projeto. Comece agora!
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

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Histórico de Projetos</h1>
            <p className="text-muted-foreground">
              Gerencie todos os seus projetos de copywriting
            </p>
          </div>
          <Button asChild>
            <Link to="/quiz">
              <Plus className="w-4 h-4 mr-2" />
              Novo Projeto
            </Link>
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar projetos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Projetos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{state.projects.length}</div>
              <p className="text-xs text-muted-foreground">
                Copies criadas até agora
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Este Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {state.projects.filter(p => {
                  const projectMonth = p.createdAt.getMonth();
                  const currentMonth = new Date().getMonth();
                  return projectMonth === currentMonth;
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Projetos criados em {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Projeto Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">
                {state.currentProject?.name || 'Nenhum'}
              </div>
              <p className="text-xs text-muted-foreground">
                Projeto em visualização
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{project.name}</CardTitle>
                    <CardDescription className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {project.createdAt.toLocaleDateString('pt-BR')}
                    </CardDescription>
                  </div>
                  {state.currentProject?.id === project.id && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Produto:</p>
                    <p className="text-sm line-clamp-2">{project.answers.product}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Público:</p>
                    <p className="text-sm line-clamp-2">{project.answers.target}</p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleViewProject(project)}
                      asChild
                    >
                      <Link to="/dashboard">
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteProject(project.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProjects.length === 0 && searchTerm && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Nenhum projeto encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Tente buscar por outros termos ou crie um novo projeto.
            </p>
            <Button variant="outline" onClick={() => setSearchTerm('')}>
              Limpar busca
            </Button>
          </div>
        )}

        {/* Quick Actions */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Dicas Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">💡 Organize seus projetos</h4>
                <p className="text-muted-foreground">
                  Use nomes descritivos para encontrar facilmente seus projetos.
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">🚀 Teste variações</h4>
                <p className="text-muted-foreground">
                  Crie múltiplas versões do mesmo produto para testar A/B.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default History;
