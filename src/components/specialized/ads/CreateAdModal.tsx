
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSpecializedCopies } from '@/hooks/useSpecializedCopies';

interface CreateAdModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateAdModal = ({ open, onOpenChange }: CreateAdModalProps) => {
  const { createCopy } = useSpecializedCopies('ads');
  const [formData, setFormData] = useState({
    title: '',
    platform: '',
    headline: '',
    content: '',
    cta: '',
    tags: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const copyData = {
      copy_type: 'ads' as const,
      title: formData.title,
      platform: formData.platform,
      copy_data: {
        headline: formData.headline,
        content: formData.content,
        cta: formData.cta
      },
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    };

    const result = await createCopy(copyData);
    
    if (result) {
      setFormData({
        title: '',
        platform: '',
        headline: '',
        content: '',
        cta: '',
        tags: ''
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1E1E1E] border-[#4B5563] text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Criar Novo Anúncio</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Anúncio</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="bg-[#2A2A2A] border-[#4B5563] text-white"
                placeholder="Ex: Campanha Black Friday"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform">Plataforma</Label>
              <Select value={formData.platform} onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}>
                <SelectTrigger className="bg-[#2A2A2A] border-[#4B5563] text-white">
                  <SelectValue placeholder="Selecione a plataforma" />
                </SelectTrigger>
                <SelectContent className="bg-[#2A2A2A] border-[#4B5563]">
                  <SelectItem value="facebook">Facebook Ads</SelectItem>
                  <SelectItem value="google">Google Ads</SelectItem>
                  <SelectItem value="instagram">Instagram Ads</SelectItem>
                  <SelectItem value="linkedin">LinkedIn Ads</SelectItem>
                  <SelectItem value="youtube">YouTube Ads</SelectItem>
                  <SelectItem value="tiktok">TikTok Ads</SelectItem>
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
              placeholder="Digite a headline que vai chamar atenção"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Texto do Anúncio</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="bg-[#2A2A2A] border-[#4B5563] text-white min-h-[120px]"
              placeholder="Escreva o corpo do anúncio..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cta">Call to Action (CTA)</Label>
            <Input
              id="cta"
              value={formData.cta}
              onChange={(e) => setFormData(prev => ({ ...prev, cta: e.target.value }))}
              className="bg-[#2A2A2A] border-[#4B5563] text-white"
              placeholder="Ex: Comprar Agora, Saiba Mais"
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
              placeholder="conversão, vendas, promoção"
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
              Criar Anúncio
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
