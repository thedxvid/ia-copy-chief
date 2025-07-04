import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Eye, Calendar, Search, Filter, Plus, Info, MessageSquare, Bot } from 'lucide-react';
import { ViewCopyModal } from '@/components/specialized/ViewCopyModal';
import { downloadCopyAsText, downloadCopyAsJSON } from '@/utils/copyExport';
import { useCopyHistory } from '@/hooks/useCopyHistory';
import { CardSkeleton } from '@/components/ui/loading-skeleton';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const History = () => {
  const { historyItems, loading, error, isUsingExampleData } = useCopyHistory();
  const [selectedCopy, setSelectedCopy] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const { toast } = useToast();
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Em teste':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'Alta conversão':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Média conversão':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Baixa conversão':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === 'Conversa') {
      return <MessageSquare className="w-5 h-5 text-white" />;
    }
    return <FileText className="w-5 h-5 text-white" />;
  };

  const handleViewDetails = (item: any) => {
    setSelectedCopy(item);
    setIsViewModalOpen(true);
    toast({
      title: "Visualizando detalhes",
      description: `Abrindo detalhes ${item.source === 'conversation' ? 'da conversa' : 'da copy'} "${item.title}"`
    });
  };

  const handlePreview = (item: any) => {
    setSelectedCopy(item);
    setIsViewModalOpen(true);
    toast({
      title: "Prévia carregada",
      description: `Exibindo prévia ${item.source === 'conversation' ? 'da conversa' : 'do conteúdo'} "${item.title}"`
    });
  };

  const handleDownload = (item: any, format: 'text' | 'json' = 'text') => {
    if (format === 'text') {
      downloadCopyAsText(item);
      toast({
        title: "Download iniciado",
        description: `Baixando "${item.title}" como arquivo TXT`
      });
    } else {
      downloadCopyAsJSON(item);
      toast({
        title: "Download iniciado",
        description: `Baixando "${item.title}" como arquivo JSON`
      });
    }
  };

  const handleCreateFirstCopy = () => {
    navigate('/products');
    toast({
      title: "Redirecionando",
      description: "Vá para a página de produtos para criar sua primeira copy"
    });
  };

  const handleContinueConversation = (item: any) => {
    // Redirecionar para o chat com a sessão específica
    navigate('/chat', { state: { sessionId: item.id } });
    toast({
      title: "Redirecionando",
      description: "Abrindo conversa no chat"
    });
  };

  const filteredItems = historyItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.source === 'conversation' && item.conversation_data?.agent_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const uniqueTypes = [...new Set(historyItems.map(item => item.type))];
  const uniqueStatuses = [...new Set(historyItems.map(item => item.status))];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Histórico de Copies</h1>
            <p className="text-[#CCCCCC]">
              Acompanhe todas as suas copies criadas e seus resultados
            </p>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Histórico de Copies</h1>
            <p className="text-[#CCCCCC]">
              Acompanhe todas as suas copies criadas e seus resultados
            </p>
          </div>
          <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
            <CardContent className="p-6 text-center">
              <p className="text-red-400 mb-4">Erro ao carregar histórico</p>
              <Button onClick={() => window.location.reload()}>
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Histórico de Copies</h1>
            <p className="text-[#CCCCCC]">
              Acompanhe todas as suas copies e conversas criadas
            </p>
          </div>
          {historyItems.length === 0 && (
            <Button 
              onClick={handleCreateFirstCopy}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Copy
            </Button>
          )}
        </div>

        {/* Indicador de dados de exemplo */}
        {isUsingExampleData && historyItems.length > 0 && (
          <Card className="bg-[#1E1E1E] border-[#4B5563]/20 border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-blue-400 font-medium">Visualizando dados de exemplo</p>
                  <p className="text-[#CCCCCC] text-sm">
                    Estas são copies e conversas de demonstração. Crie produtos e converse com agentes para ver seu histórico personalizado.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCreateFirstCopy}
                  className="ml-auto"
                >
                  Criar Copy Real
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros e Busca */}
        <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#CCCCCC] w-4 h-4" />
                  <Input
                    placeholder="Buscar copies e conversas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-[#2A2A2A] border-[#4B5563] text-white placeholder-[#CCCCCC]"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[180px] bg-[#2A2A2A] border-[#4B5563] text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2A2A] border-[#4B5563]">
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {uniqueTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px] bg-[#2A2A2A] border-[#4B5563] text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2A2A] border-[#4B5563]">
                    <SelectItem value="all">Todos os status</SelectItem>
                    {uniqueStatuses.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Copies e Conversas */}
        <div className="grid gap-4">
          {filteredItems.length === 0 ? (
            <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
              <CardContent className="p-8 text-center">
                <FileText className="w-16 h-16 text-[#4B5563] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  {searchTerm || filterType !== 'all' || filterStatus !== 'all' 
                    ? 'Nenhum item encontrado'
                    : 'Nenhum item ainda'
                  }
                </h3>
                <p className="text-[#CCCCCC] mb-6">
                  {searchTerm || filterType !== 'all' || filterStatus !== 'all' 
                    ? 'Tente ajustar os filtros de busca para encontrar o que procura.'
                    : 'Você ainda não criou nenhuma copy ou conversa. Comece criando seu primeiro produto ou conversando com um agente!'
                  }
                </p>
                {!searchTerm && filterType === 'all' && filterStatus === 'all' && (
                  <div className="flex gap-2 justify-center">
                    <Button 
                      onClick={handleCreateFirstCopy}
                      className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Copy
                    </Button>
                    <Button 
                      onClick={() => navigate('/chat')}
                      variant="outline"
                      className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#4B5563]/20"
                    >
                      <Bot className="w-4 h-4 mr-2" />
                      Chat com IA
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredItems.map((item) => (
              <Card key={item.id} className="bg-[#1E1E1E] border-[#4B5563]/20 hover:border-[#4B5563]/40 transition-all duration-200 hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-[#3B82F6] rounded-xl flex items-center justify-center">
                        {getTypeIcon(item.type)}
                      </div>
                      <div>
                        <CardTitle className="text-white text-lg">{item.title}</CardTitle>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-1 text-[#CCCCCC] text-sm">
                            <Calendar className="w-4 h-4" />
                            <span>{item.date}</span>
                          </div>
                          <Badge variant="outline" className="text-[#CCCCCC] border-[#4B5563]">
                            {item.type}
                          </Badge>
                          {item.source === 'conversation' && item.conversation_data && (
                            <Badge variant="outline" className="text-[#3B82F6] border-[#3B82F6]/30 bg-[#3B82F6]/10">
                              {item.conversation_data.agent_name}
                            </Badge>
                          )}
                          {item.source === 'quiz' && (
                            <Badge variant="outline" className="text-[#10B981] border-[#10B981]/30 bg-[#10B981]/10">
                              Quiz IA
                            </Badge>
                          )}
                          {item.source === 'specialized' && (
                            <Badge variant="outline" className="text-[#8B5CF6] border-[#8B5CF6]/30 bg-[#8B5CF6]/10">
                              Especializada
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-[#CCCCCC] hover:text-white hover:bg-[#4B5563]/20"
                        onClick={() => handlePreview(item)}
                        title="Visualizar conteúdo"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-[#CCCCCC] hover:text-white hover:bg-[#4B5563]/20"
                        onClick={() => handleDownload(item)}
                        title="Baixar como TXT"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                      <Badge className={getPerformanceColor(item.performance)}>
                        {item.performance}
                      </Badge>
                      {item.source === 'conversation' && item.conversation_data?.message_count && (
                        <Badge variant="outline" className="text-[#CCCCCC] border-[#4B5563]">
                          {item.conversation_data.message_count} mensagens
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="bg-[#3B82F6] hover:bg-[#2563EB] text-white transition-colors"
                        onClick={() => handleViewDetails(item)}
                      >
                        Ver Detalhes
                      </Button>
                      {item.source === 'conversation' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#4B5563]/20"
                          onClick={() => handleContinueConversation(item)}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Continuar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Modal Unificado */}
        <ViewCopyModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          copyData={selectedCopy}
          copyType={selectedCopy?.source === 'conversation' ? 'conversation' : selectedCopy?.source}
        />
      </div>
    </DashboardLayout>
  );
};

export default History;
