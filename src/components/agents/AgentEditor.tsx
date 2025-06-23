
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Save, Copy, Eye } from 'lucide-react';
import { useCustomAgents } from '@/hooks/useCustomAgents';

interface AgentEditorProps {
  isOpen: boolean;
  onClose: () => void;
  agentId?: string;
  duplicateFromAgent?: any;
}

const iconOptions = [
  '🤖', '👨‍💼', '👩‍💼', '🎯', '📊', '💡', '🚀', '⭐', '🔥', '💎',
  '📝', '🎨', '📢', '💰', '🎬', '📱', '🌟', '⚡', '🎪', '🎭'
];

const promptTemplates = [
  {
    name: 'Especialista em Marketing',
    prompt: `Você é um especialista em marketing digital com mais de 10 anos de experiência.

Sua especialidade é criar:
- Estratégias de marketing eficazes
- Conteúdo persuasivo e envolvente
- Campanhas de alto impacto
- Análises de mercado precisas

Sempre responda em português brasileiro e foque em resultados mensuráveis.`
  },
  {
    name: 'Copywriter Profissional',
    prompt: `Você é um copywriter profissional especializado em vendas e conversão.

Sua especialidade é criar:
- Textos persuasivos que convertem
- Headlines impactantes
- CTAs irresistíveis
- Copies para diferentes plataformas

Sempre responda em português brasileiro e use técnicas comprovadas de copywriting.`
  },
  {
    name: 'Consultor de Negócios',
    prompt: `Você é um consultor de negócios experiente com foco em crescimento e estratégia.

Sua especialidade é:
- Análise de oportunidades de mercado
- Estratégias de crescimento
- Otimização de processos
- Planejamento estratégico

Sempre responda em português brasileiro com foco em resultados práticos e implementáveis.`
  }
];

export const AgentEditor: React.FC<AgentEditorProps> = ({
  isOpen,
  onClose,
  agentId,
  duplicateFromAgent
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [iconName, setIconName] = useState('🤖');
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { customAgents, createAgent, updateAgent } = useCustomAgents();

  useEffect(() => {
    if (isOpen) {
      if (agentId) {
        // Editar agente existente
        const agent = customAgents.find(a => a.id === agentId);
        if (agent) {
          setName(agent.name);
          setDescription(agent.description || '');
          setPrompt(agent.prompt);
          setIconName(agent.icon_name);
        }
      } else if (duplicateFromAgent) {
        // Verificar se é um agente padrão - BLOQUEAR duplicação
        const isDefaultAgent = !duplicateFromAgent.id || typeof duplicateFromAgent.id === 'string' && !duplicateFromAgent.user_id;
        
        if (isDefaultAgent) {
          console.warn('Tentativa de duplicar agente padrão bloqueada por segurança');
          // Fechar o editor e não permitir duplicação
          onClose();
          return;
        }
        
        // Duplicar apenas agentes customizados
        setName(`${duplicateFromAgent.name} (Cópia)`);
        setDescription(duplicateFromAgent.description || '');
        setPrompt(duplicateFromAgent.prompt);
        setIconName(duplicateFromAgent.icon_name || '🤖');
      } else {
        // Novo agente
        resetForm();
      }
    }
  }, [isOpen, agentId, duplicateFromAgent, customAgents, onClose]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrompt('');
    setIconName('🤖');
    setShowPreview(false);
  };

  const handleSave = async () => {
    if (!name.trim() || !prompt.trim()) {
      return;
    }

    setIsLoading(true);

    try {
      if (agentId) {
        await updateAgent(agentId, {
          name: name.trim(),
          description: description.trim() || null,
          prompt: prompt.trim(),
          icon_name: iconName
        });
      } else {
        await createAgent({
          name: name.trim(),
          description: description.trim() || undefined,
          prompt: prompt.trim(),
          icon_name: iconName
        });
      }

      onClose();
      resetForm();
    } finally {
      setIsLoading(false);
    }
  };

  const applyTemplate = (template: typeof promptTemplates[0]) => {
    setPrompt(template.prompt);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1A1A1A] border-[#333333] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            {agentId ? 'Editar Agente' : 'Criar Novo Agente'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-white">Nome do Agente *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Especialista em Marketing Digital"
                className="bg-[#2A2A2A] border-[#4B5563] text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Descrição</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descrição do que o agente faz"
                className="bg-[#2A2A2A] border-[#4B5563] text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Ícone</Label>
              <Select value={iconName} onValueChange={setIconName}>
                <SelectTrigger className="bg-[#2A2A2A] border-[#4B5563] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2A2A2A] border-[#4B5563]">
                  {iconOptions.map((icon) => (
                    <SelectItem key={icon} value={icon} className="text-white hover:bg-[#3A3A3A]">
                      <span className="text-lg mr-2">{icon}</span>
                      {icon}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Templates de Prompt</Label>
              <div className="flex flex-wrap gap-2">
                {promptTemplates.map((template) => (
                  <Badge
                    key={template.name}
                    variant="outline"
                    className="cursor-pointer border-[#4B5563] text-[#CCCCCC] hover:bg-[#3B82F6]/20 hover:border-[#3B82F6]"
                    onClick={() => applyTemplate(template)}
                  >
                    {template.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Instruções do Agente *</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Descreva como o agente deve se comportar, suas especialidades e estilo de comunicação..."
                className="bg-[#2A2A2A] border-[#4B5563] text-white min-h-[200px] resize-none"
              />
              <p className="text-xs text-[#CCCCCC]">
                Defina a personalidade, especialidades e instruções específicas para o agente.
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-white">Prévia do Agente</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#4B5563]/20"
              >
                <Eye className="w-4 h-4 mr-1" />
                {showPreview ? 'Ocultar' : 'Mostrar'}
              </Button>
            </div>

            {showPreview && (
              <div className="bg-[#2A2A2A] border border-[#4B5563] rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#3B82F6] rounded-xl flex items-center justify-center">
                    <span className="text-lg">{iconName}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{name || 'Nome do Agente'}</h3>
                    <p className="text-sm text-[#CCCCCC]">{description || 'Descrição do agente'}</p>
                  </div>
                </div>
                
                <div className="bg-[#1A1A1A] rounded-lg p-3">
                  <h4 className="text-sm font-medium text-white mb-2">Instruções:</h4>
                  <p className="text-xs text-[#CCCCCC] whitespace-pre-wrap">
                    {prompt || 'As instruções do agente aparecerão aqui...'}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-[#2A2A2A] border border-[#4B5563] rounded-lg p-4">
              <h4 className="font-medium text-white mb-2">💡 Dicas para criar um bom agente:</h4>
              <ul className="text-sm text-[#CCCCCC] space-y-1">
                <li>• Seja específico sobre a especialidade do agente</li>
                <li>• Defina o tom de voz e estilo de comunicação</li>
                <li>• Inclua exemplos do tipo de conteúdo que deve criar</li>
                <li>• Especifique sempre responder em português brasileiro</li>
                <li>• Foque em resultados práticos e aplicáveis</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-[#333333]">
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#4B5563]/20"
          >
            <X className="w-4 h-4 mr-1" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || !prompt.trim() || isLoading}
            className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
          >
            <Save className="w-4 h-4 mr-1" />
            {isLoading ? 'Salvando...' : (agentId ? 'Atualizar' : 'Criar')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
