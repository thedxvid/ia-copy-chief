
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
}

export interface AdsBriefing extends AIBriefing {
  platform: string;
  campaign_objective: 'sales' | 'leads' | 'traffic' | 'awareness';
  budget_range: string;
}

export interface PagesBriefing extends AIBriefing {
  page_type: 'landing' | 'sales' | 'squeeze' | 'thank-you' | 'webinar';
  conversion_goal: string;
  main_offer: string;
}

export interface ContentBriefing extends AIBriefing {
  content_type: 'post' | 'email' | 'newsletter' | 'blog' | 'caption' | 'story';
  content_length: 'short' | 'medium' | 'long';
  call_to_action: string;
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
      const prompt = buildSalesVideoPrompt(briefing);
      
      const result = await triggerN8nWorkflow({
        type: 'copy_generation',
        user_id: user.id,
        data: {
          copy_type: 'sales_video',
          prompt,
          briefing
        },
        workflow_id: 'specialized-copy-generation'
      });

      const content = {
        hook: extractSection(result.generatedCopy, 'HOOK'),
        script: extractSection(result.generatedCopy, 'SCRIPT'),
        cta: extractSection(result.generatedCopy, 'CTA'),
        duration: briefing.video_duration
      };

      setGeneratedContent(content);
      toast.success('Script de VSL gerado com sucesso!');
      return content;
      
    } catch (error) {
      console.error('Erro ao gerar copy de vídeo:', error);
      toast.error('Erro ao gerar copy. Tente novamente.');
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
      const prompt = buildAdsPrompt(briefing);
      
      const result = await triggerN8nWorkflow({
        type: 'copy_generation',
        user_id: user.id,
        data: {
          copy_type: 'ads',
          prompt,
          briefing
        },
        workflow_id: 'specialized-copy-generation'
      });

      const content = {
        headline: extractSection(result.generatedCopy, 'HEADLINE'),
        content: extractSection(result.generatedCopy, 'BODY'),
        cta: extractSection(result.generatedCopy, 'CTA')
      };

      setGeneratedContent(content);
      toast.success('Copy de anúncio gerada com sucesso!');
      return content;
      
    } catch (error) {
      console.error('Erro ao gerar copy de anúncio:', error);
      toast.error('Erro ao gerar copy. Tente novamente.');
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
      const prompt = buildPagePrompt(briefing);
      
      const result = await triggerN8nWorkflow({
        type: 'copy_generation',
        user_id: user.id,
        data: {
          copy_type: 'page',
          prompt,
          briefing
        },
        workflow_id: 'specialized-copy-generation'
      });

      const content = {
        page_type: briefing.page_type,
        headline: extractSection(result.generatedCopy, 'HEADLINE'),
        subheadline: extractSection(result.generatedCopy, 'SUBHEADLINE'),
        content: extractSection(result.generatedCopy, 'CONTENT'),
        cta: extractSection(result.generatedCopy, 'CTA')
      };

      setGeneratedContent(content);
      toast.success('Copy de página gerada com sucesso!');
      return content;
      
    } catch (error) {
      console.error('Erro ao gerar copy de página:', error);
      toast.error('Erro ao gerar copy. Tente novamente.');
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
      const prompt = buildContentPrompt(briefing);
      
      const result = await triggerN8nWorkflow({
        type: 'copy_generation',
        user_id: user.id,
        data: {
          copy_type: 'content',
          prompt,
          briefing
        },
        workflow_id: 'specialized-copy-generation'
      });

      const content = {
        content_type: briefing.content_type,
        title: extractSection(result.generatedCopy, 'TITLE'),
        content: extractSection(result.generatedCopy, 'CONTENT'),
        hashtags: extractSection(result.generatedCopy, 'HASHTAGS')
      };

      setGeneratedContent(content);
      toast.success('Conteúdo gerado com sucesso!');
      return content;
      
    } catch (error) {
      console.error('Erro ao gerar conteúdo:', error);
      toast.error('Erro ao gerar conteúdo. Tente novamente.');
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

// Funções auxiliares para construir prompts
function buildSalesVideoPrompt(briefing: SalesVideoBriefing): string {
  return `
Crie um script completo de VSL (Video Sales Letter) para:

PRODUTO: ${briefing.product_name}
BENEFÍCIOS: ${briefing.product_benefits}
PÚBLICO-ALVO: ${briefing.target_audience}
DURAÇÃO: ${briefing.video_duration} minutos
TOM: ${briefing.tone}
OFERTA: ${briefing.offer_details}
ESTRATÉGIA DE PREÇO: ${briefing.price_strategy}
OBJETIVO: ${briefing.objective}
${briefing.additional_info ? `INFORMAÇÕES EXTRAS: ${briefing.additional_info}` : ''}

Estruture a resposta em:

HOOK:
[Hook inicial de 30-60 segundos que prende a atenção]

SCRIPT:
[Script completo dividido em seções: problema, agitação, solução, benefícios, prova social, oferta, urgência]

CTA:
[Call to action final persuasivo e direto]

Seja persuasivo, use gatilhos mentais e foque na conversão.
  `;
}

function buildAdsPrompt(briefing: AdsBriefing): string {
  return `
Crie uma copy completa de anúncio para:

PRODUTO: ${briefing.product_name}
BENEFÍCIOS: ${briefing.product_benefits}
PÚBLICO-ALVO: ${briefing.target_audience}
PLATAFORMA: ${briefing.platform}
OBJETIVO: ${briefing.campaign_objective}
ORÇAMENTO: ${briefing.budget_range}
TOM: ${briefing.tone}
OBJETIVO ESPECÍFICO: ${briefing.objective}
${briefing.additional_info ? `INFORMAÇÕES EXTRAS: ${briefing.additional_info}` : ''}

Estruture a resposta em:

HEADLINE:
[Headline principal que chama atenção]

BODY:
[Corpo do anúncio com benefícios e persuasão]

CTA:
[Call to action claro e persuasivo]

Otimize para a plataforma ${briefing.platform} e foque em ${briefing.campaign_objective}.
  `;
}

function buildPagePrompt(briefing: PagesBriefing): string {
  return `
Crie uma copy completa de ${briefing.page_type} para:

PRODUTO: ${briefing.product_name}
BENEFÍCIOS: ${briefing.product_benefits}
PÚBLICO-ALVO: ${briefing.target_audience}
TIPO DE PÁGINA: ${briefing.page_type}
OBJETIVO DE CONVERSÃO: ${briefing.conversion_goal}
OFERTA PRINCIPAL: ${briefing.main_offer}
TOM: ${briefing.tone}
OBJETIVO: ${briefing.objective}
${briefing.additional_info ? `INFORMAÇÕES EXTRAS: ${briefing.additional_info}` : ''}

Estruture a resposta em:

HEADLINE:
[Headline principal impactante]

SUBHEADLINE:
[Subheadline de apoio]

CONTENT:
[Conteúdo completo da página com seções bem estruturadas]

CTA:
[Call to action otimizado para conversão]

Otimize para ${briefing.page_type} focando em ${briefing.conversion_goal}.
  `;
}

function buildContentPrompt(briefing: ContentBriefing): string {
  return `
Crie um ${briefing.content_type} para:

PRODUTO/SERVIÇO: ${briefing.product_name}
BENEFÍCIOS: ${briefing.product_benefits}
PÚBLICO-ALVO: ${briefing.target_audience}
TIPO DE CONTEÚDO: ${briefing.content_type}
TAMANHO: ${briefing.content_length}
CALL TO ACTION: ${briefing.call_to_action}
TOM: ${briefing.tone}
OBJETIVO: ${briefing.objective}
${briefing.additional_info ? `INFORMAÇÕES EXTRAS: ${briefing.additional_info}` : ''}

Estruture a resposta em:

TITLE:
[Título/assunto do conteúdo]

CONTENT:
[Conteúdo principal otimizado para ${briefing.content_type}]

HASHTAGS:
[Hashtags relevantes se aplicável]

Otimize para engajamento e ${briefing.call_to_action}.
  `;
}

function extractSection(text: string, section: string): string {
  const regex = new RegExp(`${section}:\\s*([\\s\\S]*?)(?=\\n[A-Z]+:|$)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}
