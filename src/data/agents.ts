
import React from 'react';
import { Zap, PenTool, Megaphone, TrendingUp } from 'lucide-react';

export interface Agent {
  id: string;
  name: string;
  specialty: string;
  icon: React.ComponentType<any>;
  description: string;
  sampleMessages: Array<{
    type: 'user' | 'agent';
    content: string;
  }>;
}

export const agents: Agent[] = [
  {
    id: 'copy',
    name: 'Copy Master',
    specialty: 'Copy Persuasiva',
    icon: PenTool,
    description: 'Especialista em copies que convertem vendas',
    sampleMessages: [
      { type: 'user', content: 'Preciso de uma copy para meu produto de skincare' },
      { type: 'agent', content: 'Perfeito! Vou criar uma copy irresistível para seu skincare. Me conta: qual é o principal benefício do seu produto?' },
      { type: 'user', content: 'Remove manchas em 7 dias' },
      { type: 'agent', content: '🎯 Aqui está sua copy:\n\n"MANCHAS INDESEJADAS? NÃO MAIS!\n\nDescubra o segredo que dermatologistas usam para transformar peles manchadas em pele de porcelana em apenas 7 dias.\n\n✨ Resultados visíveis já na primeira semana\n✨ Fórmula aprovada por dermatologistas\n✨ 30 dias de garantia total\n\nNão deixe as manchas controlarem sua autoestima. Sua pele perfeita está a 7 dias de distância!"' }
    ]
  },
  {
    id: 'headlines',
    name: 'Headlines Pro',
    specialty: 'Headlines Magnéticas',
    icon: Zap,
    description: 'Criador de títulos que param o scroll',
    sampleMessages: [
      { type: 'user', content: 'Preciso de uma headline para curso de inglês online' },
      { type: 'agent', content: 'Vou criar headlines que vão parar o scroll! Qual é o maior diferencial do seu curso?' },
      { type: 'user', content: 'Aprender inglês em 90 dias' },
      { type: 'agent', content: '🔥 Aqui estão 3 headlines irresistíveis:\n\n1. "90 Dias Para Ser Fluente: O Método Que Está Fazendo Brasileiros Falarem Inglês Como Nativos"\n\n2. "De Zero ao Inglês Fluente em 3 Meses: Descubra o Sistema Que Já Transformou 10.000+ Brasileiros"\n\n3. "PARE DE SONHAR EM INGLÊS: Este Método Te Faz Fluente em 90 Dias (Mesmo Se Você Já Tentou Tudo)"\n\nQual chama mais sua atenção?' }
    ]
  },
  {
    id: 'scripts',
    name: 'Script Master',
    specialty: 'Scripts de Vendas',
    icon: Megaphone,
    description: 'Roteiros para vídeos que vendem',
    sampleMessages: [
      { type: 'user', content: 'Quero um script para VSL de infoproduto' },
      { type: 'agent', content: 'Excelente! Vou criar um script que converte. Me diz: qual é o seu infoproduto e quem é seu público?' },
      { type: 'user', content: 'Curso de marketing digital para iniciantes' },
      { type: 'agent', content: '🎬 Script VSL estruturado:\n\n[0-15s] GANCHO:\n"Se você está cansado de ver todo mundo ganhando dinheiro online menos você... este vídeo vai mudar sua vida."\n\n[15-45s] PROBLEMA:\n"Eu sei como é frustrante... Você vê gente ganhando 10, 20, 50 mil por mês online e você aí, no zero..."\n\n[45-90s] SOLUÇÃO:\n"Eu criei um método passo-a-passo que já transformou mais de 5.000 iniciantes em profissionais do marketing digital..."\n\nContinuo com o resto?' }
    ]
  },
  {
    id: 'ads',
    name: 'Ads Genius',
    specialty: 'Anúncios Pagos',
    icon: TrendingUp,
    description: 'Textos para anúncios que convertem',
    sampleMessages: [
      { type: 'user', content: 'Preciso de copy para anúncio no Facebook' },
      { type: 'agent', content: 'Vamos criar um anúncio que vai bombar! Qual produto você quer anunciar e qual seu objetivo?' },
      { type: 'user', content: 'Curso de culinária online, quero gerar leads' },
      { type: 'agent', content: '👨‍🍳 Copy para Facebook Ads:\n\n🔥 VOCÊ ESTÁ CANSADO DE QUEIMAR A COMIDA?\n\nImagine preparar pratos dignos de restaurante na sua própria cozinha...\n\n✅ Receitas passo-a-passo\n✅ Técnicas profissionais simplificadas\n✅ Do básico ao avançado\n\n🎁 BAIXE GRÁTIS: "10 Receitas Que Impressionam" + Lista de Ingredientes\n\n[BOTÃO: QUERO MEU E-BOOK GRÁTIS]\n\n💬 Mais de 15.000 pessoas já baixaram!' }
    ]
  }
];
