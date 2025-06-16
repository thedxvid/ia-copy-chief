import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface ContentBriefing {
  copy_type: string;
  product_name: string;
  product_benefits: string;
  target_audience: string;
  tone: string;
  objective: string;
  content_type: string;
  content_length: string;
  call_to_action: string;
  additional_info: string;
}

interface CreateContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (briefing: ContentBriefing) => Promise<void>;
  isLoading: boolean;
}

export const CreateContentModal: React.FC<CreateContentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading
}) => {
  const [briefing, setBriefing] = useState<ContentBriefing>({
    copy_type: 'content',
    product_name: '',
    product_benefits: '',
    target_audience: '',
    tone: 'professional',
    objective: '',
    content_type: 'post',
    content_length: 'medium',
    call_to_action: '',
    additional_info: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(briefing);
  };

  const resetForm = () => {
    setBriefing({
      copy_type: 'content',
      product_name: '',
      product_benefits: '',
      target_audience: '',
      tone: 'professional',
      objective: '',
      content_type: 'post',
      content_length: 'medium',
      call_to_action: '',
      additional_info: ''
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleInputChange = (field: keyof ContentBriefing, value: string) => {
    setBriefing(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1E1E1E] border-[#4B5563]/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">Criar Novo Conteúdo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_name" className="text-white">Nome do Produto *</Label>
              <Input
                id="product_name"
                value={briefing.product_name}
                onChange={(e) => handleInputChange('product_name', e.target.value)}
                placeholder="Ex: Curso de Marketing Digital"
                className="bg-[#2A2A2A] border-[#4B5563] text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content_type" className="text-white">Tipo de Conteúdo *</Label>
              <Select value={briefing.content_type} onValueChange={(value) => handleInputChange('content_type', value)}>
                <SelectTrigger className="bg-[#2A2A2A] border-[#4B5563] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2A2A2A] border-[#4B5563] text-white">
                  <SelectItem value="post">Post para Redes Sociais</SelectItem>
                  <SelectItem value="article">Artigo</SelectItem>
                  <SelectItem value="caption">Legenda</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="email">E-mail Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product_benefits" className="text-white">Principais Benefícios *</Label>
            <Textarea
              id="product_benefits"
              value={briefing.product_benefits}
              onChange={(e) => handleInputChange('product_benefits', e.target.value)}
              placeholder="Liste os principais benefícios do seu produto..."
              className="min-h-20 bg-[#2A2A2A] border-[#4B5563] text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_audience" className="text-white">Público-Alvo *</Label>
            <Textarea
              id="target_audience"
              value={briefing.target_audience}
              onChange={(e) => handleInputChange('target_audience', e.target.value)}
              placeholder="Descreva seu público-alvo ideal..."
              className="min-h-20 bg-[#2A2A2A] border-[#4B5563] text-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tone" className="text-white">Tom de Voz</Label>
              <Select value={briefing.tone} onValueChange={(value) => handleInputChange('tone', value)}>
                <SelectTrigger className="bg-[#2A2A2A] border-[#4B5563] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2A2A2A] border-[#4B5563] text-white">
                  <SelectItem value="professional">Profissional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="enthusiastic">Entusiasmado</SelectItem>
                  <SelectItem value="educational">Educativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content_length" className="text-white">Tamanho do Conteúdo</Label>
              <Select value={briefing.content_length} onValueChange={(value) => handleInputChange('content_length', value)}>
                <SelectTrigger className="bg-[#2A2A2A] border-[#4B5563] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2A2A2A] border-[#4B5563] text-white">
                  <SelectItem value="short">Curto</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="long">Longo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="objective" className="text-white">Objetivo do Conteúdo *</Label>
            <Textarea
              id="objective"
              value={briefing.objective}
              onChange={(e) => handleInputChange('objective', e.target.value)}
              placeholder="O que você quer alcançar com este conteúdo?"
              className="min-h-20 bg-[#2A2A2A] border-[#4B5563] text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="call_to_action" className="text-white">Chamada para Ação</Label>
            <Input
              id="call_to_action"
              value={briefing.call_to_action}
              onChange={(e) => handleInputChange('call_to_action', e.target.value)}
              placeholder="Ex: Acesse o link na bio, Compre agora"
              className="bg-[#2A2A2A] border-[#4B5563] text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional_info" className="text-white">Informações Adicionais</Label>
            <Textarea
              id="additional_info"
              value={briefing.additional_info}
              onChange={(e) => handleInputChange('additional_info', e.target.value)}
              placeholder="Outras informações relevantes..."
              className="min-h-20 bg-[#2A2A2A] border-[#4B5563] text-white"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A]"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !briefing.product_name || !briefing.target_audience}
              className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                'Gerar Conteúdo'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
