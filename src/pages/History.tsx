
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Eye, Calendar, Search, Filter } from 'lucide-react';
import { CopyDetailsModal } from '@/components/history/CopyDetailsModal';
import { CopyPreviewModal } from '@/components/history/CopyPreviewModal';
import { downloadCopyAsText, downloadCopyAsJSON } from '@/utils/copyExport';
import { useCopyHistory } from '@/hooks/useCopyHistory';
import { CardSkeleton } from '@/components/ui/loading-skeleton';

const History = () => {
  const { historyItems, loading, error } = useCopyHistory();
  const [selectedCopy, setSelectedCopy] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

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

  const handleViewDetails = (item: any) => {
    setSelectedCopy(item);
    setIsDetailsModalOpen(true);
  };

  const handlePreview = (item: any) => {
    setSelectedCopy(item);
    setIsPreviewModalOpen(true);
  };

  const handleDownload = (item: any, format: 'text' | 'json' = 'text') => {
    if (format === 'text') {
      downloadCopyAsText(item);
    } else {
      downloadCopyAsJSON(item);
    }
  };

  // Filtrar itens baseado na busca e filtros
  const filteredItems = historyItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const uniqueTypes = [...new Set(historyItems.map(item => item.type))];
  const uniqueStatuses = [...new Set(historyItems.map(item => item.status))];

  if (loading) {
    return (
      <div className="space-y-6">
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
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
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
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Histórico de Copies</h1>
        <p className="text-[#CCCCCC]">
          Acompanhe todas as suas copies criadas e seus resultados
        </p>
      </div>

      {/* Filtros e Busca */}
      <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#CCCCCC] w-4 h-4" />
                <Input
                  placeholder="Buscar copies..."
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

      {/* Lista de Copies */}
      <div className="grid gap-4">
        {filteredItems.length === 0 ? (
          <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
            <CardContent className="p-6 text-center">
              <p className="text-[#CCCCCC]">
                {searchTerm || filterType !== 'all' || filterStatus !== 'all' 
                  ? 'Nenhuma copy encontrada com os filtros selecionados'
                  : 'Nenhuma copy encontrada. Crie sua primeira copy!'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredItems.map((item) => (
            <Card key={item.id} className="bg-[#1E1E1E] border-[#4B5563]/20 hover:border-[#4B5563]/40 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-[#3B82F6] rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
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
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-[#CCCCCC] hover:text-white"
                      onClick={() => handlePreview(item)}
                      title="Visualizar"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-[#CCCCCC] hover:text-white"
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
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
                    onClick={() => handleViewDetails(item)}
                  >
                    Ver Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modais */}
      <CopyDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        copyData={selectedCopy}
      />

      <CopyPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        copyData={selectedCopy}
      />
    </div>
  );
};

export default History;
