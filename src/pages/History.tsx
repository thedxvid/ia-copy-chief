
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, Calendar } from 'lucide-react';

const History = () => {
  const historyItems = [
    {
      id: 1,
      title: "Copy para Landing Page - Produto X",
      type: "Landing Page",
      date: "2024-06-10",
      status: "Concluído",
      performance: "Alta conversão"
    },
    {
      id: 2,
      title: "Headlines para Campanha Facebook",
      type: "Headlines",
      date: "2024-06-09", 
      status: "Em teste",
      performance: "Em análise"
    },
    {
      id: 3,
      title: "Script de Vendas - Webinar",
      type: "Script",
      date: "2024-06-08",
      status: "Concluído",
      performance: "Média conversão"
    },
    {
      id: 4,
      title: "Email Marketing - Promoção",
      type: "Email",
      date: "2024-06-07",
      status: "Concluído", 
      performance: "Baixa conversão"
    }
  ];

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Histórico de Copies</h1>
        <p className="text-[#CCCCCC]">
          Acompanhe todas as suas copies criadas e seus resultados
        </p>
      </div>

      <div className="grid gap-4">
        {historyItems.map((item) => (
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
                  <Button variant="ghost" size="icon" className="text-[#CCCCCC] hover:text-white">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-[#CCCCCC] hover:text-white">
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
                <Button size="sm" className="bg-[#3B82F6] hover:bg-[#2563EB] text-white">
                  Ver Detalhes
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default History;
