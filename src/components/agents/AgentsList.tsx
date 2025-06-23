
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Copy, Plus, Settings } from 'lucide-react';
import { useCustomAgents } from '@/hooks/useCustomAgents';
import { AgentEditor } from './AgentEditor';
import { chatAgents } from '@/data/chatAgents';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const AgentsList: React.FC = () => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState<string | undefined>();
  const [duplicateFromAgent, setDuplicateFromAgent] = useState<any>(null);
  const [deleteAgentId, setDeleteAgentId] = useState<string | null>(null);

  const { customAgents, loading, deleteAgent } = useCustomAgents();

  const handleEdit = (agentId: string) => {
    setEditingAgentId(agentId);
    setDuplicateFromAgent(null);
    setIsEditorOpen(true);
  };

  // Função de duplicar apenas para agentes customizados
  const handleDuplicateCustomAgent = (agent: any) => {
    setEditingAgentId(undefined);
    setDuplicateFromAgent(agent);
    setIsEditorOpen(true);
  };

  const handleCreateNew = () => {
    setEditingAgentId(undefined);
    setDuplicateFromAgent(null);
    setIsEditorOpen(true);
  };

  const handleDelete = async () => {
    if (deleteAgentId) {
      await deleteAgent(deleteAgentId);
      setDeleteAgentId(null);
    }
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setEditingAgentId(undefined);
    setDuplicateFromAgent(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Gerenciar Agentes</h2>
          <Button disabled className="bg-[#3B82F6] hover:bg-[#2563EB] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Novo Agente
          </Button>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="bg-[#1E1E1E] border-[#4B5563]/20">
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-[#4B5563] rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-[#4B5563] rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Gerenciar Agentes</h2>
        <Button
          onClick={handleCreateNew}
          className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Agente
        </Button>
      </div>

      {/* Agentes Padrão - SEM botão de duplicar */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Agentes Padrão</h3>
        <div className="grid gap-4">
          {chatAgents.map((agent) => (
            <Card key={agent.id} className="bg-[#1E1E1E] border-[#4B5563]/20">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-[#3B82F6] rounded-xl flex items-center justify-center">
                      <span className="text-lg">{agent.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{agent.name}</h3>
                      <p className="text-sm text-[#CCCCCC] mt-1">{agent.description}</p>
                      <Badge variant="outline" className="mt-2 text-xs border-[#4B5563] text-[#CCCCCC]">
                        Padrão
                      </Badge>
                    </div>
                  </div>
                  {/* Removido o botão de duplicar para agentes padrão */}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Agentes Personalizados - COM botão de duplicar */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Meus Agentes Personalizados</h3>
        {customAgents.length === 0 ? (
          <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
            <CardContent className="p-8 text-center">
              <Settings className="w-16 h-16 text-[#4B5563] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Nenhum agente personalizado ainda
              </h3>
              <p className="text-[#CCCCCC] mb-6">
                Crie seus próprios agentes personalizados do zero.
              </p>
              <Button
                onClick={handleCreateNew}
                className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Agente
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {customAgents.map((agent) => (
              <Card key={agent.id} className="bg-[#1E1E1E] border-[#4B5563]/20">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-[#3B82F6] rounded-xl flex items-center justify-center">
                        <span className="text-lg">{agent.icon_name}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{agent.name}</h3>
                        <p className="text-sm text-[#CCCCCC] mt-1">{agent.description || 'Sem descrição'}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs border-[#3B82F6] text-[#3B82F6] bg-[#3B82F6]/10">
                            Personalizado
                          </Badge>
                          <Badge variant="outline" className="text-xs border-[#4B5563] text-[#CCCCCC]">
                            {new Date(agent.created_at).toLocaleDateString('pt-BR')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(agent.id)}
                        className="text-[#CCCCCC] hover:text-white hover:bg-[#4B5563]/20"
                        title="Editar agente"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicateCustomAgent(agent)}
                        className="text-[#CCCCCC] hover:text-white hover:bg-[#4B5563]/20"
                        title="Duplicar agente"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteAgentId(agent.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        title="Excluir agente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <AgentEditor
        isOpen={isEditorOpen}
        onClose={closeEditor}
        agentId={editingAgentId}
        duplicateFromAgent={duplicateFromAgent}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteAgentId} onOpenChange={() => setDeleteAgentId(null)}>
        <AlertDialogContent className="bg-[#1A1A1A] border-[#333333] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Agente</AlertDialogTitle>
            <AlertDialogDescription className="text-[#CCCCCC]">
              Tem certeza que deseja excluir este agente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#4B5563]/20">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
