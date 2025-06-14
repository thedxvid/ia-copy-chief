
export interface CopyTemplate {
  id: string;
  name: string;
  niche: string;
  type: 'headlines' | 'ads' | 'sales' | 'cta';
  template: string;
  variables: string[];
  estimatedTokens: number;
  description: string;
}

export const copyTemplates: CopyTemplate[] = [
  // HEADLINES - FITNESS
  {
    id: 'fitness-headline-1',
    name: 'Transformação Corporal',
    niche: 'Fitness',
    type: 'headlines',
    template: 'Transforme seu corpo em {{timeframe}} com o método {{productName}} - {{benefitNumber}} {{targetAudience}} já conseguiram {{mainBenefit}}',
    variables: ['timeframe', 'productName', 'benefitNumber', 'targetAudience', 'mainBenefit'],
    estimatedTokens: 400,
    description: 'Headlines focadas em transformação física'
  },
  {
    id: 'fitness-headline-2',
    name: 'Perda de Peso Urgente',
    niche: 'Fitness',
    type: 'headlines',
    template: 'URGENTE: {{targetAudience}} descobrem como perder {{weightAmount}} em {{timeframe}} sem {{painPoint}}',
    variables: ['targetAudience', 'weightAmount', 'timeframe', 'painPoint'],
    estimatedTokens: 350,
    description: 'Headlines com urgência para perda de peso'
  },

  // HEADLINES - MARKETING DIGITAL
  {
    id: 'marketing-headline-1',
    name: 'Faturamento Online',
    niche: 'Marketing Digital',
    type: 'headlines',
    template: 'Como {{targetAudience}} estão faturando {{revenue}} por mês com {{productName}} - Método comprovado em {{timeframe}}',
    variables: ['targetAudience', 'revenue', 'productName', 'timeframe'],
    estimatedTokens: 450,
    description: 'Headlines focadas em resultados financeiros'
  },

  // ADS - E-COMMERCE
  {
    id: 'ecommerce-ad-1',
    name: 'Oferta Limitada',
    niche: 'E-commerce',
    type: 'ads',
    template: '🔥 OFERTA RELÂMPAGO: {{productName}} com {{discount}}% OFF apenas hoje!\n\n✅ {{benefit1}}\n✅ {{benefit2}}\n✅ {{benefit3}}\n\nFrete GRÁTIS para todo Brasil!\nApenas {{stockQuantity}} unidades restantes.\n\n👆 CLIQUE E GARANTE O SEU!',
    variables: ['productName', 'discount', 'benefit1', 'benefit2', 'benefit3', 'stockQuantity'],
    estimatedTokens: 800,
    description: 'Anúncios com urgência e escassez'
  },

  // SALES - INFOPRODUTOS
  {
    id: 'infoproduct-sales-1',
    name: 'Script Descoberta',
    niche: 'Infoprodutos',
    type: 'sales',
    template: 'Olá {{prospect}}, você já se perguntou por que {{painPoint}}?\n\nEu descobri que {{statistics}}% das pessoas que têm esse problema nunca conseguem {{desiredOutcome}} porque...\n\n[REVELAR O PROBLEMA RAIZ]\n\nMas e se eu te dissesse que existe uma forma de {{solution}} em apenas {{timeframe}}?\n\nO {{productName}} já ajudou {{socialProof}} pessoas a conseguirem {{results}}.\n\nQuer saber como?',
    variables: ['prospect', 'painPoint', 'statistics', 'desiredOutcome', 'solution', 'timeframe', 'productName', 'socialProof', 'results'],
    estimatedTokens: 1500,
    description: 'Script baseado em descoberta do problema'
  },

  // CTAs - GERAL
  {
    id: 'urgency-cta-1',
    name: 'CTA com Urgência',
    niche: 'Geral',
    type: 'cta',
    template: '⚡ {{action}} AGORA - Últimas {{quantity}} vagas com {{discount}}% OFF! ⚡',
    variables: ['action', 'quantity', 'discount'],
    estimatedTokens: 200,
    description: 'CTA com urgência e escassez'
  }
];

export const niches = [
  'Fitness',
  'Marketing Digital',
  'E-commerce',
  'Infoprodutos',
  'Beleza',
  'Relacionamentos',
  'Finanças',
  'Culinária',
  'Desenvolvimento Pessoal',
  'Tecnologia',
  'Geral'
];

export const getTemplatesByNiche = (niche: string, type?: string) => {
  return copyTemplates.filter(template => {
    const nicheMatch = template.niche === niche || template.niche === 'Geral';
    const typeMatch = type ? template.type === type : true;
    return nicheMatch && typeMatch;
  });
};

export const getTemplateById = (id: string) => {
  return copyTemplates.find(template => template.id === id);
};
