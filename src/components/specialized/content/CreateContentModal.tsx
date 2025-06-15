
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSpecializedCopies } from '@/hooks/useSpecializedCopies';

interface CreateContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateContentModal = ({ open, onOpenChange }: CreateContentModalProps) => {
  const { createCopy } = useSpecializedCopies('content');
  const [formData, setFormData] = useState({
    title: '',
    content_type: '',
    content_title: '',
    content: '',
    hashtags: '',
    tags: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const copyData = {
      copy_type: 'content' as const,
      title: formData.title,
      copy_data: {
        content_type: formData.content_type,
        title: formData.content_title,
        content: formData.content,
        hashtags: formData.hashtags
      },
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    };

    const result = await createCopy(copyData);
    
    if (result) {
      setFormData({
        title: '',
        content_type: '',
        content_title: '',
        content: '',
        hashtags: '',
        tags: ''
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1E1E1E] border-[#4B5563] text-white max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Criar Novo Conteúdo</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Conteúdo</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="bg-[#2A2A2A] border-[#4B5563] text-white"
                placeholder="Ex: Post Instagram - Dicas Fitness"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content_type">Tipo de Conteúdo</Label>
              <Select value={formData.content_type} onValueChange={(value) => setFormData(prev => ({ ...prev, content_type: value }))}>
                <SelectTrigger className="bg-[#2A2A2A] border-[#4B5563] text-white">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="bg-[#2A2A2A] border-[#4B5563]">
                  <SelectItem value="post">Post Redes Sociais</SelectItem>
                  <SelectItem value="email">Email Marketing</SelectItem>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="blog">Artigo de Blog</SelectItem>
                  <SelectItem value="caption">Caption/Legenda</SelectItem>
                  <SelectItem value="story">Stories</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content_title">Título/Assunto</Label>
            <Input
              id="content_title"
              value={formData.content_title}
              onChange={(e) => setFormData(prev => ({ ...prev, content_title: e.target.value }))}
              className="bg-[#2A2A2A] border-[#4B5563] text-white"
              placeholder="Título do post, assunto do email, etc."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="bg-[#2A2A2A] border-[#4B5563] text-white min-h-[150px]"
              placeholder="Escreva o conteúdo completo..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hashtags">Hashtags/Keywords</Label>
            <Input
              id="hashtags"
              value={formData.hashtags}
              onChange={(e) => setFormData(prev => ({ ...prev, hashtags: e.target.value }))}
              className="bg-[#2A2A2A] border-[#4B5563] text-white"
              placeholder="#marketing #vendas #empreendedorismo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              className="bg-[#2A2A2A] border-[#4B5563] text-white"
              placeholder="social media, email, blog"
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
              Criar Conteúdo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
