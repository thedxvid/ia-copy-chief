
export interface QuizAnswers {
  [key: string]: string;
}

export function generateCopy(answers: QuizAnswers, quizType: string) {
  switch (quizType) {
    case 'vsl':
      return generateVSLScript(answers);
    case 'product':
      return generateProductOffer(answers);
    case 'landing':
      return generateLandingPageCopy(answers);
    case 'ads':
      return generateAdsCopy(answers);
    default:
      return { title: 'Copy Gerada', content: 'Tipo de quiz não encontrado.' };
  }
}

function generateVSLScript(answers: QuizAnswers) {
  const duration = answers.duration || '';
  const isShort = duration.includes('30 segundos') || duration.includes('1-2 minutos');
  
  return {
    title: 'Roteiro de Vídeo de Vendas (VSL)',
    content: `🎬 ROTEIRO DE VSL - ${answers.product || 'SEU PRODUTO'}

📱 DURAÇÃO: ${answers.duration || 'Definir duração'}
🎯 AVATAR: ${answers.avatar || 'Público-alvo'}
📍 PLATAFORMA: ${answers.platform || 'Definir plataforma'}

---

${isShort ? '[0-3s] HOOK INICIAL:' : '[0-5s] HOOK INICIAL:'}
"Se você é ${answers.avatar?.toLowerCase() || 'alguém que busca resultados'}, NÃO ${answers.platform?.includes('vertical') ? 'passe' : 'feche'} esse vídeo!"

${isShort ? '[4-10s]' : '[6-20s]'} PROBLEMA/DOR:
"Eu sei como é frustrante ${answers.pain?.toLowerCase() || 'não conseguir os resultados que quer'}..."
"Você já tentou de tudo, mas nada funcionou até agora, certo?"

${isShort ? '[11-20s]' : '[21-40s]'} APRESENTAÇÃO DA SOLUÇÃO:
"Por isso eu criei ${answers.product || 'esta solução'}..."
"Que vai te entregar ${answers.promise?.toLowerCase() || 'os resultados que você sempre quis'}!"

${!isShort ? `[41-60s] DIFERENCIAL/PROVA:
"E sabe o que nos torna únicos? ${answers.social_proof?.includes('números') ? 'Nossos resultados comprovados' : 'Nossa abordagem exclusiva'}!"
${answers.social_proof?.includes('Depoimentos') ? '"Veja o que nossos clientes estão dizendo..."' : '"Já são mais de X pessoas com resultados incríveis!"'}

[61-80s] URGÊNCIA/ESCASSEZ:` : '[21-25s] CALL TO ACTION:'}
${answers.urgency !== 'Sem urgência real' ? `"Mas atenção: ${answers.urgency?.toLowerCase() || 'essa oferta é por tempo limitado'}!"` : ''}
"Clique no link ${answers.platform?.includes('Instagram') ? 'da bio' : 'abaixo'} AGORA e garante sua vaga!"

---

💡 DICAS DE GRAVAÇÃO:
• Tom: ${answers.tone || 'Definir tom'}
• Energia: ${answers.tone?.includes('Motivacional') ? 'Alta energia durante todo o vídeo' : 'Mantenha consistência no tom escolhido'}
• Olhar: Sempre direto para a câmera
• Cortes: A cada 3-5 segundos para manter atenção
• Legendas: Sempre incluir para maior alcance

🎵 MÚSICA SUGERIDA:
${answers.tone?.includes('Motivacional') ? 'Instrumental motivacional/energético' : 
  answers.tone?.includes('Emocional') ? 'Instrumental emotivo/inspirador' : 
  'Instrumental neutro que complemente sua voz'}

📊 ELEMENTOS VISUAIS:
• Primeiro plano: Você falando
• Textos/emojis reforçando pontos importantes
${answers.social_proof !== 'Ainda não tenho' ? '• Depoimentos ou resultados intercalados' : ''}
• CTA visual claro no final

---

TESTE A/B SUGERIDO:
Hook alternativo: "Em ${isShort ? '30 segundos' : '60 segundos'} vou te mostrar como ${answers.promise?.toLowerCase() || 'transformar seus resultados'}..."

Teste qual versão gera mais engajamento com seu público!`
  };
}

function generateProductOffer(answers: QuizAnswers) {
  return {
    title: 'Estrutura de Oferta Completa',
    content: `🛍️ OFERTA IRRESISTÍVEL - ${answers.main_product || 'SEU PRODUTO'}

💎 NICHO: ${answers.niche || 'Definir nicho'}
💰 PREÇO: ${answers.main_price || 'Definir valor'}
⏰ ENTREGA: ${answers.delivery || 'Definir prazo'}

---

🎯 PRODUTO PRINCIPAL:
${answers.main_product || 'Descrever produto principal'}

📚 ESTRUTURA:
${answers.modules || 'Definir quantidade de módulos'}

✨ BÔNUS INCLUSOS:
${answers.bonuses || 'Listar bônus da oferta'}

---

🚀 DIFERENCIAIS ÚNICOS:
${answers.differentials || 'Definir diferenciais competitivos'}

💸 RETORNO ESPERADO:
${answers.roi || 'Definir ROI/resultados esperados'}

🛡️ GARANTIA:
${answers.guarantee !== 'Sem garantia' ? `Garantia de ${answers.guarantee} - Satisfação total ou seu dinheiro de volta!` : 'Produto sem garantia'}

🆘 SUPORTE INCLUSO:
${answers.support || 'Definir tipo de suporte'}

---

📈 ESTRUTURA DE PREÇOS SUGERIDA:

VALOR NORMAL: R$ ${calculateAnchorPrice(answers.main_price)}
VALOR PROMOCIONAL: ${answers.main_price}
ECONOMIA: R$ ${calculateSavings(answers.main_price)}

🎁 BÔNUS AGREGADOS:
${generateBonusBreakdown(answers.bonuses)}

💰 VALOR TOTAL DA OFERTA: R$ ${calculateTotalValue(answers.main_price)}
🔥 INVESTIMENTO HOJE: ${answers.main_price}

---

⚡ COPY PARA CHECKOUT:

"🚨 OFERTA ESPECIAL - ${answers.niche?.toUpperCase()}

✅ ${answers.main_product}
${generateBonusList(answers.bonuses)}

🛡️ ${answers.guarantee !== 'Sem garantia' ? `+ Garantia de ${answers.guarantee}` : ''}
🆘 + ${answers.support}

💰 De R$ ${calculateAnchorPrice(answers.main_price)} por apenas ${answers.main_price}

🔥 GARANTE SUA VAGA AGORA!
⏰ ${answers.delivery}"

---

🎯 UPSELL SUGERIDO:
"Que tal TURBINAR seus resultados?"
"Por apenas +R$ 197, você ganha:"
• Implementação 1:1 comigo
• Análise personalizada do seu caso
• Suporte VIP por WhatsApp

💡 DOWNSELL SUGERIDO:
"Não pode investir o valor total agora?"
"Comece com nossa versão básica:"
• Módulo principal
• Suporte por email
• Por apenas R$ ${calculateDownsell(answers.main_price)}

---

📊 MÉTRICAS PARA ACOMPANHAR:
• Taxa de conversão da página
• Ticket médio com upsells
• Índice de reembolso
• Satisfação dos clientes (NPS)`
  };
}

function generateLandingPageCopy(answers: QuizAnswers) {
  return {
    title: 'Copy Completa para Landing Page',
    content: `🏠 LANDING PAGE - ${answers.lead_magnet || 'SUA OFERTA'}

🎯 OBJETIVO: ${answers.objective || 'Definir objetivo'}
📱 TRÁFEGO: ${answers.traffic_source || 'Definir fonte de tráfego'}
📋 CAPTURA: ${answers.capture_info || 'Definir dados coletados'}

---

🔥 HEADLINE PRINCIPAL:
${generateHeadline(answers)}

📝 SUB-HEADLINE:
${generateSubHeadline(answers)}

---

📱 SEÇÃO HERO:

[HEADLINE]
${generateHeadline(answers)}

[SUB-HEADLINE]  
${generateSubHeadline(answers)}

[CTA BUTTON]
"${generateCTAButton(answers)}"

---

✅ BENEFÍCIOS (O QUE VAI RECEBER):

${generateBenefitsList(answers)}

---

🎁 SOBRE A OFERTA:

${answers.lead_magnet || 'Descreva sua isca digital aqui'}

${answers.urgency_landing !== 'Não há urgência real' ? `
⏰ ATENÇÃO: ${answers.urgency_landing}` : ''}

---

🛡️ TRATAMENTO DE OBJEÇÕES:

${generateObjectionsHandling(answers)}

---

💬 PROVA SOCIAL:

${answers.testimonials !== 'Ainda não tenho' ? `
"Veja o que nossos clientes estão dizendo:"

[INSERIR DEPOIMENTOS AQUI]

${answers.testimonials.includes('resultados') ? '📊 Resultados comprovados de clientes reais' : ''}` : 
'🔜 Em breve teremos depoimentos de clientes reais aqui'}

---

📋 FORMULÁRIO DE CAPTURA:

${generateFormFields(answers)}

[BOTÃO]
"${generateCTAButton(answers)}"

${answers.urgency_landing !== 'Não há urgência real' ? `
⚡ ${answers.urgency_landing}` : ''}

---

🔒 SEGURANÇA & PRIVACIDADE:
"Seus dados estão 100% seguros. Não fazemos spam."

---

📱 VERSÃO MOBILE:
${answers.device_priority?.includes('Mobile') ? 
'✅ Otimizada para mobile-first (formulário simplificado)' : 
'✅ Responsiva para todos os dispositivos'}

---

🎯 PRÓXIMOS PASSOS:
${answers.next_step || 'Definir fluxo pós-conversão'}

---

📊 ELEMENTOS PARA TESTAR:
• Headline vs sub-headline
• Cor do botão CTA
• Quantidade de campos no formulário
• Posição da prova social
• Diferentes ofertas de isca digital

💡 MÉTRICAS IMPORTANTES:
• Taxa de conversão geral
• Taxa de conversão mobile vs desktop
• Origem do tráfego com melhor conversão
• Horários de maior conversão`
  };
}

function generateAdsCopy(answers: QuizAnswers) {
  return {
    title: 'Variações de Anúncios para Teste A/B',
    content: `📢 ANÚNCIOS PARA ${answers.platform?.toUpperCase() || 'PLATAFORMA'}

🎯 OBJETIVO: ${answers.campaign_objective || 'Definir objetivo'}
💰 ORÇAMENTO: ${answers.budget || 'Definir orçamento'}
📱 FORMATO: ${answers.ad_format || 'Definir formato'}
🔥 AUDIÊNCIA: ${answers.audience_temperature || 'Definir temperatura'}

---

🅰️ VARIAÇÃO A - FOCO NA DOR:

${generateAdVariationA(answers)}

---

🅱️ VARIAÇÃO B - FOCO NO BENEFÍCIO:

${generateAdVariationB(answers)}

---

🆚 VARIAÇÃO C - FOCO NA URGÊNCIA:

${generateAdVariationC(answers)}

---

🎯 SEGMENTAÇÃO SUGERIDA:

📍 ${answers.targeting || 'Definir segmentação detalhada'}

🌡️ TEMPERATURA DA AUDIÊNCIA: ${answers.audience_temperature}
${answers.audience_temperature?.includes('Fria') ? 
'• Foque em despertar curiosidade\n• Use prova social forte\n• Evite vendas diretas' :
answers.audience_temperature?.includes('Morna') ? 
'• Relembre o problema\n• Reforce a solução\n• Use urgência moderada' :
'• Seja mais direto\n• Use urgência forte\n• Foque na ação'}

---

💰 ESTRATÉGIA DE LANCE:
${answers.budget?.includes('20 - 50') ? 
'• Comece com CPC manual\n• Teste audiências menores\n• Foque em 1-2 variações' :
'• Use lance automático\n• Teste múltiplas audiências\n• Rode todas as variações'}

---

📊 MÉTRICAS PARA ACOMPANHAR:

Primárias:
• CTR (Click-Through Rate)
• CPC (Custo Por Clique)  
• CPM (Custo Por Mil Impressões)
${answers.desired_action?.includes('Compra') ? '• ROAS (Retorno do Investimento)' : '• CPL (Custo Por Lead)'}

Secundárias:
• Relevância do anúncio
• Comentários e engajamento
• Alcance único
• Frequência de exibição

---

🔄 REMARKETING:
${answers.remarketing?.includes('Sim') ? 
`✅ Configurado - Use copy mais direta:
"Ainda não aproveitou nossa oferta?"
"Última chance de garantir..."
"Especial para quem já nos conhece..."` :
`❌ Configure o remarketing para:
• Visitantes da landing page
• Pessoas que assistiram vídeos
• Clientes que não compraram`}

---

⏰ CRONOGRAMA DE TESTES:

Semana 1: Teste variações A vs B
Semana 2: Melhor variação vs C
Semana 3: Otimize a vencedora
Semana 4: Scale da melhor performance

---

🎯 HORÁRIOS SUGERIDOS:
${answers.audience_temperature?.includes('executivo') ? 
'• 7h-9h (antes do trabalho)\n• 12h-14h (almoço)\n• 18h-20h (pós trabalho)' :
'• Teste 24h inicialmente\n• Identifique picos de performance\n• Concentre budget nos melhores horários'}

💡 DICA FINAL: 
${answers.performance_history?.includes('Primeira') ? 
'Como é sua primeira campanha, comece devagar e aumente o budget conforme os resultados.' :
'Use seu histórico para otimizar mais rapidamente as novas campanhas.'}`
  };
}

// Helper functions
function calculateAnchorPrice(price: string): string {
  const priceRanges: { [key: string]: string } = {
    'R$ 97 - R$ 297': '597',
    'R$ 297 - R$ 997': '1.997',
    'R$ 997 - R$ 2.997': '5.997',
    'R$ 2.997 - R$ 9.997': '19.997',
    'Acima de R$ 10.000': '29.997'
  };
  return priceRanges[price] || '997';
}

function calculateSavings(price: string): string {
  const anchor = calculateAnchorPrice(price);
  const current = price.split(' - ')[1]?.replace('R$ ', '').replace('.', '') || '297';
  return (parseInt(anchor) - parseInt(current)).toString();
}

function calculateTotalValue(price: string): string {
  const anchor = parseInt(calculateAnchorPrice(price));
  return (anchor + 500).toString(); // Add bonus value
}

function calculateDownsell(price: string): string {
  const current = price.split(' - ')[0]?.replace('R$ ', '') || '97';
  return current;
}

function generateBonusBreakdown(bonuses: string): string {
  if (!bonuses) return '• Bônus a definir (R$ 297)';
  
  return bonuses.split(',').map((bonus, index) => 
    `• ${bonus.trim()} (R$ ${(index + 1) * 197})`
  ).join('\n');
}

function generateBonusList(bonuses: string): string {
  if (!bonuses) return '✅ Bônus exclusivos inclusos';
  
  return bonuses.split(',').map(bonus => 
    `✅ ${bonus.trim()}`
  ).join('\n');
}

function generateHeadline(answers: QuizAnswers): string {
  const headlines = [
    `Descubra Como ${answers.lead_magnet?.replace(/^(E-book|Planilha|Mini-curso)\s*/i, '') || 'Transformar Seus Resultados'}`,
    `${answers.lead_magnet || 'Material Exclusivo'} - Baixe Grátis Agora!`,
    `A Estratégia Que ${answers.objective?.includes('leads') ? 'Gera Leads Qualificados' : 'Transforma Visitantes em Clientes'}`
  ];
  return headlines[0];
}

function generateSubHeadline(answers: QuizAnswers): string {
  return `${answers.lead_magnet || 'Material exclusivo'} para você ${answers.objective?.includes('leads') ? 'começar a gerar leads hoje mesmo' : 'implementar ainda hoje'}. ${answers.capture_info?.includes('email') ? 'Só precisa do seu melhor email!' : 'Cadastro rápido e simples.'}`;
}

function generateCTAButton(answers: QuizAnswers): string {
  const ctas = {
    'Capturar leads (email)': 'QUERO RECEBER GRÁTIS',
    'Download de material': 'BAIXAR AGORA GRÁTIS',
    'Inscrição em webinar/evento': 'GARANTIR MINHA VAGA',
    'Agendamento de consultoria': 'AGENDAR CONSULTORIA'
  };
  return ctas[answers.objective as keyof typeof ctas] || 'QUERO ACESSO GRÁTIS';
}

function generateBenefitsList(answers: QuizAnswers): string {
  const benefits = [
    `✅ ${answers.lead_magnet || 'Material exclusivo'} para download imediato`,
    '✅ Estratégias práticas e aplicáveis',
    '✅ Resultados desde a primeira implementação',
    `✅ ${answers.next_step?.includes('email') ? 'Conteúdos exclusivos por email' : 'Acesso direto ao material'}`
  ];
  return benefits.join('\n');
}

function generateObjectionsHandling(answers: QuizAnswers): string {
  if (!answers.objections) return '❓ "Será que funciona?" → ✅ Método testado e aprovado\n❓ "É complicado?" → ✅ Passo a passo simples';
  
  return answers.objections.split(',').map(objection => 
    `❓ "${objection.trim()}" → ✅ Solução específica aqui`
  ).join('\n');
}

function generateFormFields(answers: QuizAnswers): string {
  const fieldTypes = {
    '1 campo (só email)': '[EMAIL] Digite seu melhor email:',
    '2 campos (nome + email)': '[NOME] Digite seu nome:\n[EMAIL] Digite seu melhor email:',
    '3 campos (nome + email + telefone)': '[NOME] Digite seu nome:\n[EMAIL] Digite seu melhor email:\n[TELEFONE] Digite seu WhatsApp:',
    '4+ campos (dados completos)': '[NOME] Digite seu nome:\n[EMAIL] Digite seu melhor email:\n[TELEFONE] Digite seu WhatsApp:\n[EMPRESA] Nome da sua empresa:'
  };
  return fieldTypes[answers.form_fields as keyof typeof fieldTypes] || '[EMAIL] Digite seu melhor email:';
}

function generateAdVariationA(answers: QuizAnswers): string {
  return `💔 Cansado de ${answers.targeting?.toLowerCase().includes('empreendedor') ? 'não conseguir escalar seu negócio' : 'não ter os resultados que quer'}?

Eu sei exatamente como você se sente...

${answers.targeting?.toLowerCase() || 'Muitas pessoas'} passam por isso todos os dias.

Mas e se eu te dissesse que existe uma forma simples de mudar isso?

👆 Clique aqui e descubra como!

#${answers.platform?.replace(/\s+/g, '') || 'resultados'}`;
}

function generateAdVariationB(answers: QuizAnswers): string {
  return `🚀 ${answers.desired_action?.includes('Compra') ? 'Transforme sua vida' : 'Descubra o método'} que já ajudou +1.000 pessoas!

✅ ${answers.campaign_objective?.includes('Conversões') ? 'Resultados comprovados' : 'Sistema testado'}
✅ ${answers.budget?.includes('300') ? 'Método profissional' : 'Processo simples'}
✅ Funciona mesmo para iniciantes

${answers.audience_temperature?.includes('Quente') ? 'Você já sabe que funciona...' : 'Chegou a hora de mudar seus resultados!'}

👆 Clique e comece hoje mesmo!

#transformacao #${answers.platform?.replace(/\s+/g, '') || 'sucesso'}`;
}

function generateAdVariationC(answers: QuizAnswers): string {
  return `⚡ ÚLTIMAS ${answers.seasonality?.includes('Black Friday') ? '48 HORAS' : 'VAGAS'} DISPONÍVEIS!

${answers.audience_temperature?.includes('Fria') ? 'Oportunidade única para quem quer resultados reais!' : 'Não perca essa chance!'}

🔥 ${answers.budget?.includes('1.000') ? 'Investimento profissional' : 'Preço especial'}
🔥 ${answers.remarketing?.includes('Sim') ? 'Para nossos seguidores' : 'Primeira vez com desconto'}
🔥 Garantia total de resultados

⏰ Termina em algumas horas!

👆 GARANTE JÁ SUA VAGA!

#urgente #${answers.platform?.replace(/\s+/g, '') || 'oportunidade'}`;
}
