
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSpecializedCopies } from '@/hooks/useSpecializedCopies';

interface CreateVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateVideoModal = ({ open, onOpenChange }: CreateVideoModalProps) => {
  const { createCopy } = useSpecializedCopies('sales-videos');
  const [formData, setFormData] = useState({
    title: '',
    hook: '',
    script: '',
    cta: '',
    duration: '',
    tags: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const copyData = {
      copy_type: 'sales-videos' as const,
      title: formData.title,
      copy_data: {
        hook: formData.hook,
        script: formData.script,
        cta: formData.cta,
        duration: formData.duration
      },
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    };

    const result = await createCopy(copyData);
    
    if (result) {
      setFormData({
        title: '',
        hook: '',
        script: '',
        cta: '',
        duration: '',
        tags: ''
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1E1E1E] border-[#4B5563] text-white max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Criar Script de VSL</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Script</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="bg-[#2A2A2A] border-[#4B5563] text-white"
                placeholder="Ex: VSL Produto X - Versão 2.0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duração (minutos)</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                className="bg-[#2A2A2A] border-[#4B5563] text-white"
                placeholder="Ex: 15"
                type="number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hook">Hook Inicial (Gancho)</Label>
            <Textarea
              id="hook"
              value={formData.hook}
              onChange={(e) => setFormData(prev => ({ ...prev, hook: e.target.value }))}
              className="bg-[#2A2A2A] border-[#4B5563] text-white min-h-[80px]"
              placeholder="Primeiros 30 segundos que vão prender a atenção..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="script">Script Completo</Label>
            <Textarea
              id="script"
              value={formData.script}
              onChange={(e) => setFormData(prev => ({ ...prev, script: e.target.value }))}
              className="bg-[#2A2A2A] border-[#4B5563] text-white min-h-[200px]"
              placeholder="Digite o script completo do vídeo..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cta">Call to Action Final</Label>
            <Textarea
              id="cta"
              value={formData.cta}
              onChange={(e) => setFormData(prev => ({ ...prev, cta: e.target.value }))}
              className="bg-[#2A2A2A] border-[#4B5563] text-white min-h-[80px]"
              placeholder="Como você vai pedir para a pessoa agir no final..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              className="bg-[#2A2A2A] border-[#4B5563] text-white"
              placeholder="vsl, vendas, conversão"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-[#4B5563] text-[#CCCCCC] hover:bg-[#2A2A2A]"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
            >
              Criar Script
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
