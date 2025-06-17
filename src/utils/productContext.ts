
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

  // Estratégia do produto
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

  // Ofertas do produto
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
      sections.push(`Bônus: ${product.offer.bonuses.length} bônus disponíveis`);
    }
    
    if (product.offer.upsell) {
      sections.push('Possui Upsell configurado');
    }
    
    if (product.offer.downsell) {
      sections.push('Possui Downsell configurado');
    }
  }

  // Copy existente
  if (product.copy) {
    sections.push('\n**CONTEÚDO EXISTENTE:**');
    
    if (product.copy.vsl_script) {
      sections.push(`VSL Script: ${product.copy.vsl_script.substring(0, 200)}...`);
    }
    
    if (product.copy.landing_page_copy) {
      sections.push('Possui Landing Page configurada');
    }
    
    if (product.copy.email_campaign) {
      sections.push('Possui Campanha de Email configurada');
    }
    
    if (product.copy.whatsapp_messages && product.copy.whatsapp_messages.length > 0) {
      sections.push(`WhatsApp: ${product.copy.whatsapp_messages.length} mensagens`);
    }
  }

  // Meta informações
  if (product.meta) {
    if (product.meta.tags && product.meta.tags.length > 0) {
      sections.push(`\n**TAGS:** ${product.meta.tags.join(', ')}`);
    }
    
    if (product.meta.private_notes) {
      sections.push(`\n**NOTAS:** ${product.meta.private_notes}`);
    }
  }

  return sections.join('\n');
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
