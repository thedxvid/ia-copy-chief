
import { useState } from 'react';
import { useN8nIntegration } from './useN8nIntegration';
import { useAuth } from '@/contexts/AuthContext';
import { useTokens } from './useTokens';
import { toast } from 'sonner';

export interface AIBriefing {
  product_name: string;
  product_benefits: string;
  target_audience: string;
  tone: 'professional' | 'casual' | 'urgent' | 'emotional' | 'educational';
  objective: string;
  additional_info?: string;
}

export interface SalesVideoBriefing extends AIBriefing {
  video_duration: string;
  offer_details: string;
  price_strategy: string;
  copy_type: 'sales_video';
}

export interface AdsBriefing extends AIBriefing {
  platform: string;
  campaign_objective: 'sales' | 'leads' | 'traffic' | 'awareness';
  budget_range: string;
  copy_type: 'ads';
}

export interface PagesBriefing extends AIBriefing {
  page_type: 'landing' | 'sales' | 'squeeze' | 'thank-you' | 'webinar';
  conversion_goal: string;
  main_offer: string;
  copy_type: 'page';
}

export interface ContentBriefing extends AIBriefing {
  content_type: 'post' | 'email' | 'newsletter' | 'blog' | 'caption' | 'story';
  content_length: 'short' | 'medium' | 'long';
  call_to_action: string;
  copy_type: 'content';
}

export const useAICopyGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  
  const { triggerN8nWorkflow } = useN8nIntegration();
  const { user } = useAuth();
  const { canAffordFeature } = useTokens();

  const generateSalesVideoCopy = async (briefing: SalesVideoBriefing) => {
    if (!user?.id) {
      toast.error('Você precisa estar logado');
      return null;
    }

    if (!canAffordFeature('copy')) {
      toast.error('Tokens insuficientes para gerar copy');
      return null;
    }

    setIsGenerating(true);
    
    try {
      console.log('🎬 Generating sales video copy with briefing:', briefing);
      
      // Estrutura corrigida para compatibilidade com a edge function
      const result = await triggerN8nWorkflow({
        type: 'copy_generation',
        user_id: user.id,
        data: {
          copy_type: 'sales_video',
          briefing: briefing
        },
        workflow_id: 'specialized-copy-generation'
      });

      const content = {
        hook: extractSection(result.generatedCopy, 'HOOK'),
        script: extractSection(result.generatedCopy, 'SCRIPT') || extractSection(result.generatedCopy, 'DESENVOLVIMENTO'),
        cta: extractSection(result.generatedCopy, 'CTA'),
        duration: briefing.video_duration,
        fullContent: result.generatedCopy
      };

      setGeneratedContent(content);
      toast.success('Script de VSL gerado com sucesso!');
      return content;
      
    } catch (error) {
      console.error('Erro ao gerar copy de vídeo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar copy. Tente novamente.';
      
      if (errorMessage.includes('Tokens insuficientes')) {
        toast.error('❌ Tokens Insuficientes!', {
          description: 'Você não tem tokens suficientes para esta operação.',
        });
      } else {
        toast.error('❌ Erro ao gerar copy', {
          description: errorMessage,
        });
      }
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAdsCopy = async (briefing: AdsBriefing) => {
    if (!user?.id) {
      toast.error('Você precisa estar logado');
      return null;
    }

    if (!canAffordFeature('copy')) {
      toast.error('Tokens insuficientes para gerar copy');
      return null;
    }

    setIsGenerating(true);
    
    try {
      console.log('📢 Generating ads copy with briefing:', briefing);
      
      // Estrutura corrigida para compatibilidade com a edge function
      const result = await triggerN8nWorkflow({
        type: 'copy_generation',
        user_id: user.id,
        data: {
          copy_type: 'ads',
          briefing: briefing
        },
        workflow_id: 'specialized-copy-generation'
      });

      const content = {
        headline: extractSection(result.generatedCopy, 'HEADLINE') || extractSection(result.generatedCopy, 'VARIAÇÃO 1'),
        content: extractSection(result.generatedCopy, 'BODY') || extractSection(result.generatedCopy, 'VARIAÇÃO 2'),
        cta: extractSection(result.generatedCopy, 'CTA') || extractSection(result.generatedCopy, 'VARIAÇÃO 3'),
        variations: extractVariations(result.generatedCopy),
        platform: briefing.platform,
        fullContent: result.generatedCopy
      };

      setGeneratedContent(content);
      toast.success('Copy de anúncio gerada com sucesso!');
      return content;
      
    } catch (error) {
      console.error('Erro ao gerar copy de anúncio:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar copy. Tente novamente.';
      
      if (errorMessage.includes('Tokens insuficientes')) {
        toast.error('❌ Tokens Insuficientes!', {
          description: 'Você não tem tokens suficientes para esta operação.',
        });
      } else {
        toast.error('❌ Erro ao gerar copy', {
          description: errorMessage,
        });
      }
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePageCopy = async (briefing: PagesBriefing) => {
    if (!user?.id) {
      toast.error('Você precisa estar logado');
      return null;
    }

    if (!canAffordFeature('copy')) {
      toast.error('Tokens insuficientes para gerar copy');
      return null;
    }

    setIsGenerating(true);
    
    try {
      console.log('📄 Generating page copy with briefing:', briefing);
      
      // Estrutura corrigida para compatibilidade com a edge function
      const result = await triggerN8nWorkflow({
        type: 'copy_generation',
        user_id: user.id,
        data: {
          copy_type: 'page',
          briefing: briefing
        },
        workflow_id: 'specialized-copy-generation'
      });

      const content = {
        page_type: briefing.page_type,
        headline: extractSection(result.generatedCopy, 'HEADLINE'),
        subheadline: extractSection(result.generatedCopy, 'SUBHEADLINE'),
        content: extractSection(result.generatedCopy, 'CONTENT') || extractSection(result.generatedCopy, 'BENEFÍCIOS'),
        cta: extractSection(result.generatedCopy, 'CTA'),
        benefits: extractSection(result.generatedCopy, 'BENEFÍCIOS'),
        fullContent: result.generatedCopy
      };

      setGeneratedContent(content);
      toast.success('Copy de página gerada com sucesso!');
      return content;
      
    } catch (error) {
      console.error('Erro ao gerar copy de página:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar copy. Tente novamente.';
      
      if (errorMessage.includes('Tokens insuficientes')) {
        toast.error('❌ Tokens Insuficientes!', {
          description: 'Você não tem tokens suficientes para esta operação.',
        });
      } else {
        toast.error('❌ Erro ao gerar copy', {
          description: errorMessage,
        });
      }
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateContentCopy = async (briefing: ContentBriefing) => {
    if (!user?.id) {
      toast.error('Você precisa estar logado');
      return null;
    }

    if (!canAffordFeature('copy')) {
      toast.error('Tokens insuficientes para gerar copy');
      return null;
    }

    setIsGenerating(true);
    
    try {
      console.log('📝 Generating content copy with briefing:', briefing);
      
      // Estrutura corrigida para compatibilidade com a edge function
      const result = await triggerN8nWorkflow({
        type: 'copy_generation',
        user_id: user.id,
        data: {
          copy_type: 'content',
          briefing: briefing
        },
        workflow_id: 'specialized-copy-generation'
      });

      const content = {
        content_type: briefing.content_type,
        title: extractSection(result.generatedCopy, 'TITLE') || extractSection(result.generatedCopy, 'TÍTULO'),
        content: extractSection(result.generatedCopy, 'CONTENT') || extractSection(result.generatedCopy, 'DESENVOLVIMENTO'),
        hashtags: extractSection(result.generatedCopy, 'HASHTAGS'),
        cta: extractSection(result.generatedCopy, 'CTA'),
        fullContent: result.generatedCopy
      };

      setGeneratedContent(content);
      toast.success('Conteúdo gerado com sucesso!');
      return content;
      
    } catch (error) {
      console.error('Erro ao gerar conteúdo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar conteúdo. Tente novamente.';
      
      if (errorMessage.includes('Tokens insuficientes')) {
        toast.error('❌ Tokens Insuficientes!', {
          description: 'Você não tem tokens suficientes para esta operação.',
        });
      } else {
        toast.error('❌ Erro ao gerar conteúdo', {
          description: errorMessage,
        });
      }
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    generatedContent,
    generateSalesVideoCopy,
    generateAdsCopy,
    generatePageCopy,
    generateContentCopy,
    setGeneratedContent
  };
};

// Funções auxiliares melhoradas para extrair seções
function extractSection(text: string, section: string): string {
  const regex = new RegExp(`${section}[:\\-\\s]*([\\s\\S]*?)(?=\\n[A-Z][A-Z\\s]*[:\\-]|$)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

function extractVariations(text: string): string[] {
  const variations: string[] = [];
  
  // Procurar por variações numeradas
  for (let i = 1; i <= 5; i++) {
    const variation = extractSection(text, `VARIAÇÃO ${i}`);
    if (variation) {
      variations.push(variation);
    }
  }
  
  // Se não encontrou variações numeradas, dividir por seções
  if (variations.length === 0) {
    const sections = text.split(/\n(?=[A-Z])/);
    sections.forEach(section => {
      if (section.trim().length > 50) {
        variations.push(section.trim());
      }
    });
  }
  
  return variations.slice(0, 3); // Retornar no máximo 3 variações
}
