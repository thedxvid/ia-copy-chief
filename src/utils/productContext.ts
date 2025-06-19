
import type { ProductDetails } from '@/hooks/useProducts';

export interface ProductContextData {
  product: ProductDetails;
  contextText: string;
}

export const formatProductContext = (product: ProductDetails): string => {
  const sections: string[] = [];

  // Informações básicas do produto
  sections.push(`**PRODUTO: ${product.name}**`);
  sections.push(`Nicho: ${product.niche}${product.sub_niche ? ` > ${product.sub_niche}` : ''}`);
  sections.push(`Status: ${product.status}`);

  // Estratégia do produto - acessar dados corretos da estrutura do banco
  if (product.strategy) {
    sections.push('\n**ESTRATÉGIA:**');
    
    if (product.strategy.value_proposition) {
      sections.push(`Proposta de Valor: ${product.strategy.value_proposition}`);
    }
    
    if (product.strategy.target_audience) {
      const audience = typeof product.strategy.target_audience === 'string' 
        ? product.strategy.target_audience 
        : JSON.stringify(product.strategy.target_audience);
      sections.push(`Público-Alvo: ${audience}`);
    }
    
    if (product.strategy.market_positioning) {
      sections.push(`Posicionamento: ${product.strategy.market_positioning}`);
    }
  }

  // Ofertas do produto - acessar dados corretos da estrutura do banco
  if (product.offer) {
    sections.push('\n**OFERTAS:**');
    
    if (product.offer.main_offer) {
      const mainOffer = typeof product.offer.main_offer === 'string'
        ? product.offer.main_offer
        : JSON.stringify(product.offer.main_offer);
      sections.push(`Oferta Principal: ${mainOffer}`);
    }
    
    if (product.offer.pricing_strategy) {
      const pricing = typeof product.offer.pricing_strategy === 'string'
        ? product.offer.pricing_strategy
        : JSON.stringify(product.offer.pricing_strategy);
      sections.push(`Estratégia de Preço: ${pricing}`);
    }
    
    if (product.offer.bonuses && product.offer.bonuses.length > 0) {
      const bonusList = Array.isArray(product.offer.bonuses) 
        ? product.offer.bonuses.join(', ')
        : JSON.stringify(product.offer.bonuses);
      sections.push(`Bônus: ${bonusList}`);
    }
    
    if (product.offer.upsell) {
      const upsell = typeof product.offer.upsell === 'string'
        ? product.offer.upsell
        : JSON.stringify(product.offer.upsell);
      sections.push(`Upsell: ${upsell}`);
    }
    
    if (product.offer.downsell) {
      const downsell = typeof product.offer.downsell === 'string'
        ? product.offer.downsell
        : JSON.stringify(product.offer.downsell);
      sections.push(`Downsell: ${downsell}`);
    }

    if (product.offer.order_bump) {
      const orderBump = typeof product.offer.order_bump === 'string'
        ? product.offer.order_bump
        : JSON.stringify(product.offer.order_bump);
      sections.push(`Order Bump: ${orderBump}`);
    }
  }

  // Copy existente - acessar dados corretos da estrutura do banco
  if (product.copy) {
    sections.push('\n**CONTEÚDO EXISTENTE:**');
    
    if (product.copy.vsl_script && product.copy.vsl_script.trim()) {
      const vslLength = product.copy.vsl_script.length;
      const vslPreview = vslLength > 200 
        ? product.copy.vsl_script.substring(0, 200) + '...'
        : product.copy.vsl_script;
      sections.push(`VSL Script (${vslLength} caracteres): ${vslPreview}`);
    }
    
    if (product.copy.landing_page_copy) {
      const landingPage = typeof product.copy.landing_page_copy === 'string'
        ? product.copy.landing_page_copy
        : JSON.stringify(product.copy.landing_page_copy);
      sections.push(`Landing Page: ${landingPage.length > 100 ? landingPage.substring(0, 100) + '...' : landingPage}`);
    }
    
    if (product.copy.email_campaign) {
      const emailCampaign = typeof product.copy.email_campaign === 'string'
        ? product.copy.email_campaign
        : JSON.stringify(product.copy.email_campaign);
      sections.push(`Campanha de Email: ${emailCampaign.length > 100 ? emailCampaign.substring(0, 100) + '...' : emailCampaign}`);
    }
    
    if (product.copy.social_media_content) {
      const socialMedia = typeof product.copy.social_media_content === 'string'
        ? product.copy.social_media_content
        : JSON.stringify(product.copy.social_media_content);
      sections.push(`Conteúdo de Redes Sociais: ${socialMedia.length > 100 ? socialMedia.substring(0, 100) + '...' : socialMedia}`);
    }
    
    if (product.copy.whatsapp_messages && product.copy.whatsapp_messages.length > 0) {
      sections.push(`WhatsApp: ${product.copy.whatsapp_messages.length} mensagens`);
    }

    if (product.copy.telegram_messages && product.copy.telegram_messages.length > 0) {
      sections.push(`Telegram: ${product.copy.telegram_messages.length} mensagens`);
    }
  }

  // Meta informações - acessar dados corretos da estrutura do banco
  if (product.meta) {
    if (product.meta.tags && product.meta.tags.length > 0) {
      sections.push(`\n**TAGS:** ${product.meta.tags.join(', ')}`);
    }
    
    if (product.meta.private_notes && product.meta.private_notes.trim()) {
      sections.push(`\n**NOTAS PRIVADAS:** ${product.meta.private_notes}`);
    }

    if (product.meta.ai_evaluation) {
      const evaluation = typeof product.meta.ai_evaluation === 'string'
        ? product.meta.ai_evaluation
        : JSON.stringify(product.meta.ai_evaluation);
      sections.push(`\n**AVALIAÇÃO IA:** ${evaluation.length > 200 ? evaluation.substring(0, 200) + '...' : evaluation}`);
    }
  }

  const contextText = sections.join('\n');
  
  // Debug para verificar se o contexto está sendo gerado corretamente
  console.log('🔍 DEBUG - Contexto do produto gerado:', {
    productId: product.id,
    productName: product.name,
    contextLength: contextText.length,
    hasStrategy: !!product.strategy,
    hasOffer: !!product.offer,
    hasCopy: !!product.copy,
    hasMeta: !!product.meta,
    sectionsCount: sections.length
  });

  return contextText;
};

export const createProductPromptContext = (
  product: ProductDetails,
  basePrompt: string,
  copyType?: string
): string => {
  const productContext = formatProductContext(product);
  
  const contextualPrompt = `
${basePrompt}

---
CONTEXTO DO PRODUTO:
${productContext}

---
INSTRUÇÕES IMPORTANTES:
- Use as informações do produto acima como contexto principal
- Mantenha consistência com a estratégia e posicionamento definidos
- Considere o público-alvo específico do produto
- ${copyType ? `Esta copy é do tipo: ${copyType}` : ''}
- Se houver conteúdo existente, use como referência de tom e estilo
- Adapte a linguagem ao nicho e sub-nicho especificados
- Sempre que mencionar "seu produto" ou "este produto", refira-se ao ${product.name}
`;

  return contextualPrompt;
};

export const getProductSummary = (product: ProductDetails): string => {
  const parts: string[] = [];
  
  parts.push(product.name);
  parts.push(`(${product.niche})`);
  
  if (product.strategy?.value_proposition) {
    parts.push(`- ${product.strategy.value_proposition.substring(0, 50)}...`);
  }
  
  return parts.join(' ');
};
