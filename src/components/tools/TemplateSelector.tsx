
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, BookOpen, Zap } from 'lucide-react';
import { copyTemplates, niches, getTemplatesByNiche, CopyTemplate } from '@/data/copyTemplates';
import { ProductSelector } from '@/components/ui/product-selector';

interface TemplateSelectorProps {
  toolType: 'headlines' | 'ads' | 'sales' | 'cta';
  selectedNiche: string;
  onTemplateSelect: (template: CopyTemplate) => void;
  onNicheChange: (niche: string) => void;
}

export const TemplateSelector = ({ 
  toolType, 
  selectedNiche, 
  onTemplateSelect, 
  onNicheChange 
}: TemplateSelectorProps) => {
  const [availableTemplates, setAvailableTemplates] = useState<CopyTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<CopyTemplate | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const templates = getTemplatesByNiche(selectedNiche, toolType);
    setAvailableTemplates(templates);
    setSelectedTemplate(null);
  }, [selectedNiche, toolType]);

  const handleTemplateSelect = (template: CopyTemplate) => {
    setSelectedTemplate(template);
    onTemplateSelect(template);
  };

  return (
    <div className="space-y-4">
      <ProductSelector
        value={selectedProductId}
        onValueChange={setSelectedProductId}
        showPreview={true}
        placeholder="Selecione um produto para contextualizar os templates"
      />
      
      <Card className="bg-[#2A2A2A] border-[#4B5563]/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Templates por Nicho
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-white text-sm font-medium">Escolha seu nicho:</label>
            <Select value={selectedNiche} onValueChange={onNicheChange}>
              <SelectTrigger className="bg-[#1E1E1E] border-[#4B5563]/40 text-white">
                <SelectValue placeholder="Selecione um nicho" />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2A2A] border-[#4B5563]/40">
                {niches.map((niche) => (
                  <SelectItem key={niche} value={niche} className="text-white">
                    {niche}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {availableTemplates.length > 0 ? (
            <div className="space-y-3">
              <label className="text-white text-sm font-medium">
                Templates disponíveis ({availableTemplates.length}):
              </label>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'bg-[#3B82F6]/20 border-[#3B82F6]'
                        : 'bg-[#1E1E1E] border-[#4B5563]/20 hover:border-[#4B5563]/40'
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-white font-medium text-sm">
                            {template.name}
                          </h4>
                          <Badge className="bg-[#3B82F6]/20 text-[#3B82F6] text-xs">
                            {template.niche}
                          </Badge>
                        </div>
                        <p className="text-[#CCCCCC] text-xs mb-2">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-[#CCCCCC]">
                          <Zap className="w-3 h-3" />
                          ~{template.estimatedTokens} tokens
                        </div>
                      </div>
                    </div>
                    
                    {selectedTemplate?.id === template.id && (
                      <div className="mt-3 p-2 bg-[#1E1E1E] rounded text-xs text-[#CCCCCC] font-mono">
                        <strong className="text-white">Preview:</strong>
                        <br />
                        {template.template.substring(0, 150)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-[#4B5563] mx-auto mb-3" />
              <p className="text-[#CCCCCC] text-sm">
                Nenhum template disponível para este nicho e tipo de ferramenta.
              </p>
              <p className="text-[#4B5563] text-xs mt-1">
                Tente selecionar "Geral" para ver templates universais.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
