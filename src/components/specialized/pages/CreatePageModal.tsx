
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSpecializedCopies } from '@/hooks/useSpecializedCopies';

interface CreatePageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreatePageModal = ({ open, onOpenChange }: CreatePageModalProps) => {
  const { createCopy } = useSpecializedCopies('pages');
  const [formData, setFormData] = useState({
    title: '',
    page_type: '',
    headline: '',
    subheadline: '',
    content: '',
    cta: '',
    tags: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const copyData = {
      copy_type: 'pages' as const,
      title: formData.title,
      copy_data: {
        page_type: formData.page_type,
        headline: formData.headline,
        subheadline: formData.subheadline,
        content: formData.content,
        cta: formData.cta
      },
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    };

    const result = await createCopy(copyData);
    
    if (result) {
      setFormData({
        title: '',
        page_type: '',
        headline: '',
        subheadline: '',
        content: '',
        cta: '',
        tags: ''
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1E1E1E] border-[#4B5563] text-white max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Criar Nova Página</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título da Página</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="bg-[#2A2A2A] border-[#4B5563] text-white"
                placeholder="Ex: Landing Page Produto X"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="page_type">Tipo de Página</Label>
              <Select value={formData.page_type} onValueChange={(value) => setFormData(prev => ({ ...prev, page_type: value }))}>
                <SelectTrigger className="bg-[#2A2A2A] border-[#4B5563] text-white">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="bg-[#2A2A2A] border-[#4B5563]">
                  <SelectItem value="landing">Landing Page</SelectItem>
                  <SelectItem value="sales">Sales Page</SelectItem>
                  <SelectItem value="squeeze">Squeeze Page</SelectItem>
                  <SelectItem value="thank-you">Thank You Page</SelectItem>
                  <SelectItem value="webinar">Página de Webinar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="headline">Headline Principal</Label>
            <Input
              id="headline"
              value={formData.headline}
              onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
              className="bg-[#2A2A2A] border-[#4B5563] text-white"
              placeholder="Digite a headline principal da página"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subheadline">Subheadline</Label>
            <Input
              id="subheadline"
              value={formData.subheadline}
              onChange={(e) => setFormData(prev => ({ ...prev, subheadline: e.target.value }))}
              className="bg-[#2A2A2A] border-[#4B5563] text-white"
              placeholder="Subheadline de apoio"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo da Página</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="bg-[#2A2A2A] border-[#4B5563] text-white min-h-[150px]"
              placeholder="Escreva o conteúdo principal da página..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cta">Call to Action</Label>
            <Input
              id="cta"
              value={formData.cta}
              onChange={(e) => setFormData(prev => ({ ...prev, cta: e.target.value }))}
              className="bg-[#2A2A2A] border-[#4B5563] text-white"
              placeholder="Ex: Garanta sua vaga agora"
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
              placeholder="landing, conversão, vendas"
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
              Criar Página
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
