
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, FileText, Bot, Zap, PenTool, Megaphone, TrendingUp, Brain, Lightbulb, Target } from 'lucide-react';
import { useCustomAgents } from '@/hooks/useCustomAgents';
import { useToast } from '@/hooks/use-toast';

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const iconOptions = [
  { name: 'Bot', icon: Bot },
  { name: 'Zap', icon: Zap },
  { name: 'PenTool', icon: PenTool },
  { name: 'Megaphone', icon: Megaphone },
  { name: 'TrendingUp', icon: TrendingUp },
  { name: 'Brain', icon: Brain },
  { name: 'Lightbulb', icon: Lightbulb },
  { name: 'Target', icon: Target },
];

export const CreateAgentModal: React.FC<CreateAgentModalProps> = ({
  isOpen,
  onClose
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt: '',
    icon_name: 'Bot'
  });
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { createAgent, uploadFile } = useCustomAgents();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.prompt.trim()) {
      toast({
        title: "Erro",
        description: "Nome e instruções são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const agent = await createAgent(formData);
      
      // Upload dos arquivos se houver
      for (const file of files) {
        await uploadFile(agent.id, file);
      }

      toast({
        title: "Sucesso!",
        description: "Agente criado com sucesso"
      });
      
      onClose();
      resetForm();
    } catch (error) {
      console.error('Erro ao criar agente:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar agente. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      prompt: '',
      icon_name: 'Bot'
    });
    setFiles([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const selectedIcon = iconOptions.find(opt => opt.name === formData.icon_name)?.icon || Bot;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1E1E1E] border-[#4B5563]/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">Criar Novo Agente IA</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Nome do Agente *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Especialista em Marketing"
                className="bg-[#2A2A2A] border-[#4B5563] text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Ícone</Label>
              <div className="grid grid-cols-4 gap-2">
                {iconOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <button
                      key={option.name}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, icon_name: option.name }))}
                      className={`p-2 rounded-lg border-2 transition-colors ${
                        formData.icon_name === option.name
                          ? 'border-[#3B82F6] bg-[#3B82F6]/20'
                          : 'border-[#4B5563] hover:border-[#3B82F6]/50'
                      }`}
                    >
                      <IconComponent className="w-5 h-5 text-white mx-auto" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">Descrição</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Breve descrição do que o agente faz"
              className="bg-[#2A2A2A] border-[#4B5563] text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt" className="text-white">Instruções / Prompt *</Label>
            <Textarea
              id="prompt"
              value={formData.prompt}
              onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
              placeholder="Descreva detalhadamente como o agente deve se comportar, seu conhecimento e estilo de resposta..."
              className="min-h-32 bg-[#2A2A2A] border-[#4B5563] text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Arquivos de Referência</Label>
            <div className="border-2 border-dashed border-[#4B5563] rounded-lg p-4 text-center">
              <input
                type="file"
                accept=".pdf,.txt,.md,.docx"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-[#CCCCCC]" />
                <p className="text-[#CCCCCC]">Clique para adicionar arquivos</p>
                <p className="text-xs text-[#888888] mt-1">PDF, TXT, MD, DOCX (máx. 50MB cada)</p>
              </label>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, index) => (
                  <Card key={index} className="bg-[#2A2A2A] border-[#4B5563]">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#3B82F6]" />
                        <span className="text-sm text-white">{file.name}</span>
                        <span className="text-xs text-[#888888]">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-[#CCCCCC] hover:text-white p-1"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-[#4B5563]/50 pt-4">
            <Card className="bg-[#2A2A2A]/50 border-[#4B5563]/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#3B82F6] rounded-xl flex items-center justify-center">
                    {React.createElement(selectedIcon, { className: "w-5 h-5 text-white" })}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{formData.name || 'Nome do Agente'}</h3>
                    <p className="text-sm text-[#CCCCCC]">{formData.description || 'Descrição do agente'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white"
            >
              {isLoading ? 'Criando...' : 'Criar Agente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
