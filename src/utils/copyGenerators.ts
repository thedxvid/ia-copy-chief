
import { supabase } from '@/integrations/supabase/client';

export interface QuizAnswers {
  target?: string;
  pain?: string;
  product?: string;
  benefit?: string;
  differential?: string;
  objective?: string;
  [key: string]: any;
}

// Função para gerar copy via N8n + Claude
export async function generateCopyWithN8n(
  answers: QuizAnswers, 
  copyType: string,
  userId?: string
): Promise<{ title: string; content: string }> {
  try {
    // Preparar dados para envio ao N8n
    const copyGenerationData = {
      quiz_answers: answers,
      copy_type: mapCopyType(copyType),
      target_audience: answers.target || 'público geral',
      product_info: answers.product || 'produto/serviço',
      objectives: answers.objective || 'aumentar conversões',
      pain_points: answers.pain || 'problemas do cliente',
      benefits: answers.benefit || 'benefícios principais',
      differentials: answers.differential || 'diferenciais únicos'
    };

    // Chamar edge function para integração N8n
    const { data, error } = await supabase.functions.invoke('n8n-integration', {
      body: {
        type: 'copy_generation',
        user_id: userId || 'anonymous',
        data: copyGenerationData,
        workflow_id: 'copy-generation-claude',
        session_id: `copy_${Date.now()}`
      }
    });

    if (error) {
      console.error('Erro na geração via N8n:', error);
      // Fallback para geração local
      return generateCopyFallback(answers, copyType);
    }

    return {
      title: getCopyTitle(copyType),
      content: data.copy || 'Copy gerada com sucesso!'
    };

  } catch (error) {
    console.error('Erro na integração N8n:', error);
    // Fallback para geração local
    return generateCopyFallback(answers, copyType);
  }
}

function mapCopyType(quizType: string): 'vsl' | 'landing_page' | 'ads' | 'email' {
  const typeMap: Record<string, 'vsl' | 'landing_page' | 'ads' | 'email'> = {
    'vsl-script': 'vsl',
    'landing-page': 'landing_page',
    'facebook-ads': 'ads',
    'email-sequence': 'email',
    'instagram-ads': 'ads',
    'google-ads': 'ads'
  };

  return typeMap[quizType] || 'landing_page';
}

function getCopyTitle(copyType: string): string {
  const titles: Record<string, string> = {
    'vsl-script': '🎬 Roteiro de VSL Persuasivo',
    'landing-page': '🚀 Copy de Landing Page Otimizada',
    'facebook-ads': '📱 Copy para Facebook Ads',
    'instagram-ads': '📸 Copy para Instagram Ads',
    'google-ads': '🔍 Copy para Google Ads',
    'email-sequence': '📧 Sequência de Email Marketing'
  };

  return titles[copyType] || '✨ Copy Personalizada';
}

// Função de fallback para geração local (caso N8n falhe)
function generateCopyFallback(answers: QuizAnswers, copyType: string): { title: string; content: string } {
  const templates = {
    'vsl-script': generateVSLScript(answers),
    'landing-page': generateLandingPage(answers),
    'facebook-ads': generateFacebookAds(answers),
    'instagram-ads': generateInstagramAds(answers),
    'google-ads': generateGoogleAds(answers),
    'email-sequence': generateEmailSequence(answers)
  };

  return {
    title: getCopyTitle(copyType),
    content: templates[copyType as keyof typeof templates] || generateGenericCopy(answers)
  };
}

function generateVSLScript(answers: QuizAnswers): string {
  return `🎬 ROTEIRO DE VSL PERSUASIVO

PRODUTO: ${answers.product || 'Seu Produto'}
PÚBLICO: ${answers.target || 'Seu Público-Alvo'}

===== ESTRUTURA DO ROTEIRO =====

[0-15s] GANCHO INICIAL:
"Se você é ${answers.target?.toLowerCase() || 'alguém que busca resultados'}, NÃO feche este vídeo nos próximos 60 segundos..."

*Visual: Você olhando diretamente para a câmera*

[15-45s] AGITAÇÃO DO PROBLEMA:
"Eu sei exatamente como você se sente... ${answers.pain || 'Frustrado com resultados que não chegam'}.

Você já tentou tudo que conhece, mas nada funcionou como esperava, certo?"

*Visual: Imagens representando a frustração*

[45-90s] APRESENTAÇÃO DA SOLUÇÃO:
"Foi exatamente por isso que eu criei ${answers.product || 'esta solução revolucionária'}...

Que vai te entregar ${answers.benefit || 'os resultados que você sempre quis'} de forma garantida!"

*Visual: Demonstração do produto/resultado*

[90-150s] DIFERENCIAL ÚNICO:
"E sabe o que nos torna completamente diferentes de tudo que existe no mercado?

${answers.differential || 'Nossa abordagem exclusiva e comprovada'}!"

*Visual: Comparações, gráficos, provas*

[150-210s] PROVA SOCIAL:
"Já temos mais de 1.247 pessoas que transformaram suas vidas usando exatamente o que vou te mostrar..."

*Visual: Depoimentos reais, prints de resultados*

[210-270s] DETALHES DA OFERTA:
"E hoje, você vai ter acesso a TUDO isso por um valor muito especial..."

*Visual: Breakdown da oferta, bônus*

[270-300s] URGÊNCIA E ESCASSEZ:
"Mas atenção: esta oferta tem prazo limitado e apenas para as próximas 50 pessoas..."

*Visual: Timer, contador de vagas*

[300-320s] CALL TO ACTION:
"Clique no botão abaixo AGORA e garante sua transformação ainda hoje!"

*Visual: Botão pulsante, setas apontando*

===== ELEMENTOS VISUAIS =====
- Usar cortes a cada 3-5 segundos
- Incluir legendas em todas as falas
- Música de fundo motivacional (volume baixo)
- Transições dinâmicas entre seções
- Call-outs e textos de apoio

===== MÉTRICAS ESPERADAS =====
- Taxa de retenção: >60% nos primeiros 30s
- Taxa de conversão: 8-15%
- Engajamento: >25% de interações

===== DICAS DE PERFORMANCE =====
1. Grave em ambiente bem iluminado
2. Use microfone lapela para áudio limpo
3. Mantenha energia alta durante todo o vídeo
4. Faça gestos expressivos mas naturais
5. Teste diferentes thumbnails

PRÓXIMOS PASSOS:
□ Grave o VSL seguindo este roteiro
□ Edite com os elementos visuais sugeridos
□ Configure landing page de conversão
□ Teste diferentes versões da copy
□ Acompanhe métricas de performance`;
}

function generateLandingPage(answers: QuizAnswers): string {
  return `🚀 COPY DE LANDING PAGE OTIMIZADA

===== HEADLINE PRINCIPAL =====
${answers.benefit ? 
  `Descubra Como ${answers.benefit} em Apenas 30 Dias (Garantido!)` : 
  'Transforme Sua Vida em 30 Dias - Método Comprovado!'}

===== SUB-HEADLINE =====
${answers.target ? 
  `O método exclusivo que ${answers.target.toLowerCase()} estão usando para alcançar resultados extraordinários` :
  'Método exclusivo para resultados extraordinários em tempo recorde'}

===== SEÇÃO 1: PROBLEMA =====
**Você está cansado de ${answers.pain?.toLowerCase() || 'não conseguir os resultados que deseja'}?**

Se você é ${answers.target?.toLowerCase() || 'alguém que busca sucesso'}, provavelmente já passou por isso:

❌ Tentou várias estratégias mas nenhuma funcionou
❌ Perdeu tempo e dinheiro com soluções que não entregam
❌ Se sente frustrado por ver outros conseguindo e você não
❌ Está começando a duvidar se realmente é possível

**Eu entendo perfeitamente... e tenho uma boa notícia para você.**

===== SEÇÃO 2: SOLUÇÃO =====
## ${answers.product || 'Nossa Solução Revolucionária'}

Depois de anos estudando o que realmente funciona, desenvolvi um método que já transformou a vida de mais de 2.847 pessoas.

**O segredo?** ${answers.differential || 'Uma abordagem completamente diferente de tudo que você já viu.'}

### ✅ O que você vai conseguir:
- ${answers.benefit || 'Resultados garantidos em 30 dias'}
- Método passo-a-passo simples de seguir
- Suporte completo durante toda jornada
- Garantia incondicional de 30 dias

===== SEÇÃO 3: PROVA SOCIAL =====
## O Que Nossos Clientes Estão Dizendo:

> **"Em apenas 2 semanas já vi resultados incríveis..."**
> - Maria Silva, 34 anos

> **"Melhor investimento que já fiz na minha vida!"**
> - João Santos, 28 anos

> **"Funcionou exatamente como prometido."**
> - Ana Costa, 41 anos

**+ de 2.847 pessoas já transformaram suas vidas**

===== SEÇÃO 4: OFERTA =====
## 🎯 OFERTA ESPECIAL - APENAS HOJE

### VOCÊ VAI RECEBER:

**📦 PRODUTO PRINCIPAL**
${answers.product || 'Método Completo de Transformação'}
*Valor: R$ 997*

**🎁 BÔNUS #1:** Guia de Implementação Rápida
*Valor: R$ 297*

**🎁 BÔNUS #2:** 30 Dias de Suporte VIP
*Valor: R$ 497*

**🎁 BÔNUS #3:** Grupo Exclusivo de Mentorias
*Valor: R$ 697*

~~**VALOR TOTAL: R$ 2.488**~~

# HOJE APENAS: R$ 497
**ou 12x de R$ 47,90**

===== SEÇÃO 5: URGÊNCIA =====
⏰ **ATENÇÃO: Esta oferta expira em**

[CONTADOR REGRESSIVO: 23:47:12]

Apenas **17 vagas restantes** para garantir o suporte personalizado!

===== SEÇÃO 6: GARANTIA =====
## 🛡️ GARANTIA INCONDICIONAL DE 30 DIAS

Se você não obtiver resultados em 30 dias, devolvemos 100% do seu dinheiro.

**Sem perguntas. Sem complicações.**

===== CALL TO ACTION =====
# 👇 CLIQUE AGORA E TRANSFORME SUA VIDA

[BOTÃO: QUERO MINHA TRANSFORMAÇÃO AGORA]

**✅ Acesso imediato após pagamento**
**✅ Garantia de 30 dias**
**✅ Suporte completo incluído**

---

*© 2024 - Todos os direitos reservados*
*Esta oferta pode ser retirada do ar a qualquer momento*

===== FAQ =====
**P: Funciona para qualquer pessoa?**
R: Sim! Nosso método foi testado com pessoas de diferentes perfis.

**P: Quanto tempo para ver resultados?**
R: A maioria vê resultados nas primeiras 2 semanas.

**P: E se não funcionar para mim?**
R: Garantia total de 30 dias. Sem riscos.

===== ELEMENTOS TÉCNICOS =====
- **Cores**: Azul (#3B82F6) para botões, Verde (#10B981) para benefícios
- **Fontes**: Inter para textos, Roboto Bold para headlines
- **Conversões esperadas**: 12-20%
- **Tempo de leitura**: 3-5 minutos`;
}

function generateFacebookAds(answers: QuizAnswers): string {
  return `📱 COPY PARA FACEBOOK ADS

===== VARIAÇÃO 1: CURIOSIDADE =====
**PRIMARY TEXT:**
Você sabia que existe uma forma simples de ${answers.benefit?.toLowerCase() || 'transformar sua vida'} em apenas 30 dias?

${answers.target || 'Pessoas comuns'} estão usando este método e os resultados são impressionantes...

Mas tem um "segredo" que ninguém conta sobre ${answers.product || 'esta estratégia'}...

👆 Clique e descubra qual é (funciona mesmo!)

**HEADLINE:** ${answers.benefit || 'Transformação'} Garantida em 30 Dias!

**DESCRIPTION:** Método exclusivo que já mudou +2.000 vidas

===== VARIAÇÃO 2: PROBLEMA + SOLUÇÃO =====
**PRIMARY TEXT:**
PARE de ${answers.pain?.toLowerCase() || 'sofrer com problemas que têm solução'}! 😤

Se você é ${answers.target?.toLowerCase() || 'alguém que busca resultados'}, precisa conhecer ${answers.product || 'esta solução'}.

✅ Simples de implementar
✅ Resultados em semanas  
✅ Sem complicações

Já são +2.847 pessoas transformadas!

**HEADLINE:** Chega de ${answers.pain || 'Frustração'}!

**DESCRIPTION:** Solução definitiva para ${answers.target || 'você'}

===== VARIAÇÃO 3: PROVA SOCIAL =====
**PRIMARY TEXT:**
"Não acreditei quando vi os resultados..."

Isso foi o que Maria me disse depois de apenas 15 dias usando ${answers.product || 'nosso método'}.

O mesmo método que já ajudou:
👥 +2.847 pessoas
⭐ 4.9/5 estrelas de satisfação
🏆 98% de taxa de sucesso

E agora está disponível para você também!

**HEADLINE:** +2.847 Pessoas Já Conseguiram

**DESCRIPTION:** Método comprovado e garantido

===== CONFIGURAÇÕES RECOMENDADAS =====

**PÚBLICO-ALVO:**
- Idade: 25-55 anos
- Interesses: ${answers.target || 'desenvolvimento pessoal'}
- Comportamentos: Engajamento com ${answers.product || 'conteúdo relacionado'}

**ORÇAMENTO:**
- R$ 50-100/dia para teste inicial
- Escalar para R$ 200+/dia após otimização

**OBJETIVOS:**
- Primário: Conversões
- Secundário: Tráfego para landing page

**CRIATIVOS:**
- Usar vídeos de 15-30 segundos
- Carrossel com benefícios
- Imagem única com call-out

===== MÉTRICAS PARA ACOMPANHAR =====
- **CTR:** >2% (Facebook Feed)
- **CPC:** R$ 0,50 - R$ 2,00
- **CPM:** R$ 15 - R$ 40
- **Conversão:** 8-15%

===== OTIMIZAÇÕES =====
1. Teste diferentes angulos de copy
2. Varie criativos semanalmente  
3. Ajuste públicos baseado em performance
4. Use remarketing para quem visitou LP

**PRÓXIMOS PASSOS:**
□ Criar campanhas com as 3 variações
□ Configurar pixel de conversão
□ Acompanhar métricas diariamente
□ Otimizar baseado em dados`;
}

function generateInstagramAds(answers: QuizAnswers): string {
  return `📸 COPY PARA INSTAGRAM ADS

===== STORIES ADS =====
**SLIDE 1:**
Você está ${answers.pain?.toLowerCase() || 'cansado de não ver resultados'}? 😔

**SLIDE 2:**  
E se eu te dissesse que existe uma forma de ${answers.benefit?.toLowerCase() || 'mudar isso'}...

**SLIDE 3:**
${answers.product || 'Este método'} já transformou +2.000 vidas!

**SLIDE 4:**
Deslize para cima e descubra como! 👆

===== FEED POSTS =====
**VARIAÇÃO 1: CARROSSEL**

**SLIDE 1:**
🔥 SEGREDO REVELADO
Como ${answers.benefit?.toLowerCase() || 'transformar sua vida'} em 30 dias

**SLIDE 2:**
❌ Você está fazendo TUDO ERRADO se...
- Continua ${answers.pain?.toLowerCase() || 'com os mesmos problemas'}
- Não conhece ${answers.product || 'este método'}
- Acha que não tem solução

**SLIDE 3:**
✅ A SOLUÇÃO ESTÁ AQUI:
${answers.differential || 'Método exclusivo e comprovado'}

**SLIDE 4:**
📈 RESULTADOS REAIS:
+2.847 pessoas já conseguiram!

**SLIDE 5:**
👆 LINK NA BIO
Acesso imediato!

**CAPTION:**
${answers.target || 'Pessoal'}, vocês pediram e eu trouxe! 🚀

O método que mudou minha vida e de milhares de pessoas...

Se você está ${answers.pain?.toLowerCase() || 'lutando para conseguir resultados'}, PRECISA conhecer isso!

Link na bio para conhecer 👆

#transformacao #resultados #metodoprovado

===== REELS =====
**HOOK (0-3s):**
"Se você está ${answers.pain?.toLowerCase() || 'cansado disso'}, assiste até o final..."

**PROBLEMA (3-8s):**
Eu também já passei por isso... ${answers.pain || 'A frustração é real'}

**SOLUÇÃO (8-12s):**
Até descobrir ${answers.product || 'este método simples'}

**RESULTADO (12-15s):**
Agora minha vida é completamente diferente! ✨

**CTA (15-20s):**
Link na bio se você quer a mesma transformação!

**MÚSICA:** Trending audio do momento

**CAPTION:**
A transformação que você precisa está aqui! 🔥

Comentem "EU QUERO" que eu mando o link! 👇

===== IGTV/VIDEO LONGO =====
**ROTEIRO (60 segundos):**

[0-5s] "Oi gente! Hoje vou revelar o segredo que mudou tudo..."

[5-15s] "Vocês sabem que eu sempre ${answers.pain?.toLowerCase() || 'lutei com isso'}..."

[15-30s] "Até que descobri ${answers.product || 'este método incrível'}..."

[30-45s] "E os resultados foram... [mostra antes/depois]"

[45-55s] "Se vocês querem a mesma coisa, link na bio!"

[55-60s] "E não esqueçam de seguir para mais dicas! ❤️"

===== CONFIGURAÇÕES TÉCNICAS =====

**FORMATOS RECOMENDADOS:**
- Stories: 1080x1920 (9:16)
- Feed: 1080x1080 (1:1)
- Reels: 1080x1920 (9:16)
- IGTV: 1080x1920 (9:16)

**ELEMENTOS VISUAIS:**
- Cores vibrantes e contrastantes
- Texto grande e legível
- Movimento para chamar atenção
- CTAs visuais (setas, botões)

**HASHTAGS ESTRATÉGICAS:**
#${answers.target?.toLowerCase().replace(/\s+/g, '') || 'transformacao'}
#${answers.product?.toLowerCase().replace(/\s+/g, '') || 'metodo'}
#resultados #motivacao #sucesso
#empreendedorismo #mindset #foco
#meta #objetivo #conquistar

===== ENGAGEMENT TACTICS =====
- Fazer perguntas nos Stories
- Usar enquetes e quizzes
- Responder todos comentários
- Criar senso de comunidade
- Compartilhar conteúdo dos seguidores

**MÉTRICAS INSTAGRAM:**
- **Reach:** 10-15% dos seguidores
- **Engagement:** 3-6%  
- **CTR:** 1-3%
- **Salvamentos:** Indicador de qualidade

**PRÓXIMOS PASSOS:**
□ Criar conteúdo visual atrativo
□ Agendar posts para horários de pico
□ Interagir ativamente com audiência
□ Monitorar hashtags relevantes`;
}

function generateGoogleAds(answers: QuizAnswers): string {
  return `🔍 COPY PARA GOOGLE ADS

===== CAMPANHAS DE PESQUISA =====

**GRUPO 1: PALAVRAS GENÉRICAS**
Palavras-chave: [como ${answers.benefit?.toLowerCase() || 'ter sucesso'}], [${answers.product?.toLowerCase() || 'solução'} para ${answers.target?.toLowerCase() || 'pessoas'}]

**Anúncio 1:**
Headline 1: ${answers.benefit || 'Transforme Sua Vida'} em 30 Dias
Headline 2: Método Comprovado | Resultados Garantidos  
Headline 3: +2.847 Pessoas Transformadas
Description 1: Descubra o método que já mudou milhares de vidas. Simples, eficaz e garantido.
Description 2: Acesso imediato. Garantia de 30 dias. Comece hoje mesmo sua transformação!

**Anúncio 2:**
Headline 1: PARE de ${answers.pain || 'Sofrer'} - Solução Aqui!
Headline 2: ${answers.product || 'Método Exclusivo'} | Funciona
Headline 3: Garantia Total | Sem Riscos
Description 1: Chega de tentativas frustradas. Este método funciona de verdade para ${answers.target?.toLowerCase() || 'qualquer pessoa'}.
Description 2: Milhares de pessoas já conseguiram. Agora é sua vez de transformar sua vida!

**GRUPO 2: INTENÇÃO COMERCIAL**
Palavras-chave: [comprar ${answers.product?.toLowerCase() || 'curso'}], [${answers.product?.toLowerCase() || 'método'} preço], [melhor ${answers.product?.toLowerCase() || 'solução'}]

**Anúncio 1:**
Headline 1: ${answers.product || 'Método'} Oficial - Site Original
Headline 2: Desconto Especial | Apenas Hoje
Headline 3: Acesso Imediato Garantido
Description 1: Site oficial com desconto exclusivo. Não perca esta oportunidade única!
Description 2: Milhares de clientes satisfeitos. Garantia incondicional de 30 dias.

===== CAMPANHAS DISPLAY =====

**PÚBLICO: Interessados em ${answers.target?.toLowerCase() || 'desenvolvimento pessoal'}**

**Banner Principal:**
TÍTULO: "Você Está ${answers.pain || 'Perdendo Tempo'}?"
SUBTÍTULO: Descubra o método que já transformou +2.847 vidas
CTA: "QUERO CONHECER"

**Banner Alternativo:**
TÍTULO: "${answers.benefit || 'Resultados'} em 30 Dias"
SUBTÍTULO: ${answers.differential || 'Método exclusivo e comprovado'}
CTA: "COMEÇAR AGORA"

===== CAMPANHAS YOUTUBE =====

**Anúncio Bumper (6s):**
"${answers.target || 'Pessoas comuns'} estão conseguindo ${answers.benefit?.toLowerCase() || 'resultados incríveis'}. Você também pode! [Link]"

**Anúncio TrueView (30s):**
[0-5s] "Se você está ${answers.pain?.toLowerCase() || 'cansado de não conseguir resultados'}..."
[5-15s] "Este método já transformou +2.847 vidas e pode transformar a sua também!"
[15-25s] "Clique no link agora e comece sua transformação hoje mesmo!"
[25-30s] "Garantia total de 30 dias. Sem riscos!"

===== CAMPANHAS SHOPPING =====
*Caso aplicável para produtos físicos*

**Título do Produto:** ${answers.product || 'Método Exclusivo'} - Original
**Descrição:** ${answers.benefit || 'Transformação garantida'} em 30 dias. Método comprovado usado por +2.847 pessoas. Garantia incondicional.

===== EXTENSÕES RECOMENDADAS =====

**Sitelinks:**
- Sobre o Método
- Depoimentos
- Garantia
- Contato

**Callouts:**
- "Garantia de 30 Dias"  
- "Resultados Comprovados"
- "Acesso Imediato"
- "+2.847 Clientes Satisfeitos"

**Snippets Estruturados:**
- Serviços: Consultoria, Treinamento, Suporte
- Marcas: ${answers.product || 'Método Original'}
- Modelos: Básico, Completo, VIP

===== CONFIGURAÇÕES RECOMENDADAS =====

**ORÇAMENTO DIÁRIO:**
- Teste inicial: R$ 30-50/dia
- Escalar: R$ 100-300/dia baseado em performance

**ESTRATÉGIA DE LANCE:**
- Campanhas novas: CPC manual
- Campanhas otimizadas: CPA alvo ou ROAS alvo

**SEGMENTAÇÃO:**
- **Localização:** Brasil (cidades principais)
- **Idioma:** Português
- **Dispositivos:** Todos com ajustes por performance
- **Horários:** Baseado em analytics da landing page

===== MÉTRICAS PARA ACOMPANHAR =====

**MÉTRICAS PRINCIPAIS:**
- **CTR:** >3% (Pesquisa), >0.5% (Display)
- **CPC:** R$ 0.80 - R$ 3.00
- **Quality Score:** 7+ (idealmente 8-10)
- **Conversão:** 10-20%

**OTIMIZAÇÕES SEMANAIS:**
- Adicionar palavras-chave negativas
- Ajustar lances por dispositivo/localização
- Testar novos anúncios
- Otimizar landing pages para Quality Score

**PALAVRAS-CHAVE NEGATIVAS:**
- grátis, gratuito, free
- pirata, crackeado
- download, baixar
- curso básico, iniciante (se for produto avançado)

**PRÓXIMOS PASSOS:**
□ Configurar campanhas por grupos temáticos
□ Instalar acompanhamento de conversões
□ Criar landing pages específicas por grupo
□ Acompanhar Quality Score diariamente
□ Otimizar baseado em dados de performance`;
}

function generateEmailSequence(answers: QuizAnswers): string {
  return `📧 SEQUÊNCIA DE EMAIL MARKETING

===== EMAIL 1: BOAS-VINDAS (Envio: Imediato) =====

**ASSUNTO:** Bem-vindo(a)! Sua jornada de transformação começa AGORA ✨

**CORPO:**
Olá [NOME],

Que alegria ter você aqui! 🎉

Você acabou de dar o primeiro passo para ${answers.benefit?.toLowerCase() || 'transformar sua vida'}, e eu quero te parabenizar por essa decisão.

Nos próximos dias, vou compartilhar com você:

✅ Os 3 erros que impedem ${answers.target?.toLowerCase() || 'pessoas como você'} de conseguir resultados
✅ Como ${answers.differential?.toLowerCase() || 'nossa abordagem'} é diferente de tudo no mercado  
✅ Case real: como Maria conseguiu ${answers.benefit?.toLowerCase() || 'resultados incríveis'} em apenas 15 dias

E claro, vou te apresentar ${answers.product || 'nossa solução completa'} que já transformou mais de 2.847 vidas.

**Sua primeira tarefa é simples:** responda este email me contando qual é seu maior desafio relacionado a ${answers.pain?.toLowerCase() || 'sua situação atual'}.

Vou ler pessoalmente e te dar uma dica personalizada! 😊

Um abraço,
[SEU NOME]

P.S.: Adicione meu email nos seus contatos para não perder nenhuma mensagem importante!

===== EMAIL 2: EDUCACIONAL (Envio: +1 dia) =====

**ASSUNTO:** Os 3 erros que ${answers.target?.toLowerCase() || 'pessoas como você'} cometem (Erro #1 é chocante!)

**CORPO:**
Oi [NOME],

Depois de trabalhar com milhares de ${answers.target?.toLowerCase() || 'pessoas'}, descobri que 90% cometem os mesmos 3 erros fatais.

Hoje vou revelar o **ERRO #1** (que é o mais comum):

## ❌ ERRO #1: ${answers.pain || 'Focar no problema errado'}

A maioria das pessoas pensa que o problema é [explicar conceito errado comum], mas a verdade é que...

[Explicação detalhada do erro]

**Por que isso acontece?**

Porque ninguém ensina a forma CORRETA de [relacionar com o produto]. 

Na escola não aprendemos isso. Os "gurus" não contam a verdade completa. E você fica tentando resolver o problema errado.

**O que fazer então?**

Em vez de [abordagem errada], você deve [abordagem correta].

É exatamente isso que ensino em ${answers.product || 'nosso método'}.

Amanhã vou revelar o **ERRO #2** que é ainda mais prejudicial...

Até lá, reflita: você está cometendo este erro?

Um abraço,
[SEU NOME]

===== EMAIL 3: STORYTELLING (Envio: +2 dias) =====

**ASSUNTO:** A história que mudou TUDO (você vai se identificar)

**CORPO:**
[NOME],

Quero te contar uma história que pode mudar sua perspectiva...

Era 2019. Eu estava exatamente onde você está agora.

${answers.pain || 'Frustrado, sem saber que caminho seguir'}.

Já havia tentado TUDO:
- Cursos caros que não funcionaram
- Estratégias "revolucionárias" que eram pura enganação  
- Métodos complicados que tomavam todo meu tempo

Nada funcionava.

**Então aconteceu algo que mudou tudo...**

[Contar história do momento de descoberta]

Foi aí que eu entendi: o problema não era comigo. Era a ABORDAGEM que estava errada.

Desenvolvi então um método baseado em [princípios únicos], testei por meses e...

**Os resultados foram surpreendentes!**

Em apenas 30 dias, consegui [resultado específico].

Mas o melhor veio depois...

Resolvi ensinar este método para outras pessoas. E sabe o que aconteceu?

- Maria conseguiu [resultado] em 15 dias
- João transformou [área da vida] em 3 semanas  
- Ana finalmente conquistou [objetivo] após anos tentando

Já são mais de 2.847 pessoas transformadas! 🚀

**E você pode ser o próximo.**

Amanhã vou te mostrar EXATAMENTE como este método funciona.

Aguarde! 😉

[SEU NOME]

===== EMAIL 4: PROVA SOCIAL (Envio: +3 dias) =====

**ASSUNTO:** 📱 Ele me mandou ESTA foto pelo WhatsApp (impressionante!)

**CORPO:**
[NOME],

Ontem recebi uma mensagem no WhatsApp que me emocionou...

Era do Carlos, um ${answers.target?.toLowerCase() || 'cliente'} que começou ${answers.product || 'nosso método'} há apenas 3 semanas.

A foto que ele mandou mostrava [resultado específico alcançado].

Na mensagem, ele escreveu:

*"[SEU NOME], não acredito que funcionou tão rápido! Você mudou minha vida. Muito obrigado!"*

E sabe qual foi o "segredo" do Carlos?

**Ele simplesmente seguiu o passo-a-passo.**

Nada de complicações. Nada de inventar moda.

Apenas aplicou ${answers.differential || 'nossa metodologia comprovada'}.

**Outros resultados recentes:**

📈 Marina: "${answers.benefit || 'Transformação completa'} em 18 dias"

🎯 Roberto: "Melhor investimento que já fiz na vida"

✨ Fernanda: "Funcionou exatamente como prometido"

E olha que estes são apenas alguns dos milhares de depoimentos que recebo toda semana!

**A pergunta é:** quando vai ser SUA vez?

Amanhã vou revelar todos os detalhes de ${answers.product || 'nosso programa'}.

Prepare-se! 🔥

[SEU NOME]

===== EMAIL 5: OFERTA (Envio: +4 dias) =====

**ASSUNTO:** 🔓 REVELADO: ${answers.product || 'O Método'} Completo (últimas 48h)

**CORPO:**
[NOME],

Chegou o momento que você estava esperando...

Hoje vou revelar TODOS os detalhes de ${answers.product || 'nosso método exclusivo'}.

## 🚀 O QUE VOCÊ VAI RECEBER:

**MÓDULO 1:** Foundation
Como estabelecer a base correta para ${answers.benefit?.toLowerCase() || 'sua transformação'}

**MÓDULO 2:** Strategy  
A estratégia exata que uso com meus clientes VIP

**MÓDULO 3:** Implementation
Passo-a-passo para implementar sem erros

**MÓDULO 4:** Optimization
Como otimizar para resultados ainda melhores

**MÓDULO 5:** Mastery
Técnicas avançadas para resultados de elite

## 🎁 BÔNUS EXCLUSIVOS:

**BÔNUS #1:** Checklist de Implementação Rápida
*Valor: R$ 297*

**BÔNUS #2:** 30 Dias de Suporte VIP
*Valor: R$ 497*

**BÔNUS #3:** Grupo Exclusivo no Telegram
*Valor: R$ 397*

**BÔNUS #4:** Masterclass ao Vivo Mensal
*Valor: R$ 697*

## 💰 INVESTIMENTO:

~~Valor normal: R$ 2.497~~

**HOJE APENAS: R$ 497**
*ou 12x de R$ 47,90 sem juros*

## 🛡️ GARANTIA BLINDADA:

30 dias para testar. Se não funcionar, devolvemos 100% do valor.

**Mas atenção:** Esta oferta especial termina em 48 horas!

[BOTÃO: QUERO MINHA TRANSFORMAÇÃO AGORA]

Qualquer dúvida, é só responder este email.

Um abraço,
[SEU NOME]

===== EMAIL 6: URGÊNCIA (Envio: +5 dias) =====

**ASSUNTO:** ⏰ Últimas 24 horas - Não deixe passar!

**CORPO:**
[NOME],

Esta é provavelmente minha última mensagem sobre ${answers.product || 'esta oportunidade'}.

**RESTAM APENAS 24 HORAS** para você garantir:

✅ ${answers.product || 'Método Completo'} + 4 Bônus Exclusivos
✅ Preço promocional de R$ 497 (em vez de R$ 2.497)  
✅ Garantia incondicional de 30 dias
✅ Acesso imediato mesmo sendo domingo

Depois de amanhã, o investimento volta para R$ 2.497.

**Por que estou fazendo essa oferta?**

Simples: quero que você tenha a mesma transformação que já proporcionei para +2.847 pessoas.

Mas preciso limitar as vagas para conseguir dar suporte de qualidade.

**Hoje temos apenas 7 vagas restantes.**

Se você está ${answers.pain?.toLowerCase() || 'cansado da situação atual'} e quer realmente ${answers.benefit?.toLowerCase() || 'mudar sua vida'}...

Esta é SUA hora.

[BOTÃO: GARANTIR MINHA VAGA AGORA]

Nos vemos do outro lado! 🚀

[SEU NOME]

===== EMAIL 7: ÚLTIMO AVISO (Envio: +6 dias) =====

**ASSUNTO:** [ÚLTIMO AVISO] Oferta encerra em 3 horas ⏰

**CORPO:**
[NOME],

**ÚLTIMA CHANCE.**

Em exatas 3 horas, esta oferta sai do ar para sempre.

Depois disso, ${answers.product || 'o método'} só estará disponível pelo valor cheio de R$ 2.497.

Sei que você pode estar pensando:

*"Ah, sempre aparecem novas oportunidades..."*

Mas a verdade é: esta oportunidade específica, com este preço e estes bônus, não vai se repetir.

**ÚLTIMA VERIFICAÇÃO:**

✅ Você quer realmente ${answers.benefit?.toLowerCase() || 'transformar sua vida'}?
✅ Você está disposto(a) a seguir um método comprovado?  
✅ Você quer parar de ${answers.pain?.toLowerCase() || 'sofrer com essa situação'}?

Se respondeu SIM para as 3 perguntas...

[BOTÃO: SIM, QUERO MINHA TRANSFORMAÇÃO]

**Restam apenas 2 vagas.**

Esta é realmente sua última chance.

[SEU NOME]

P.S.: Se você não clicar agora, aceite que escolheu continuar como está. A decisão é sua.

===== CONFIGURAÇÕES TÉCNICAS =====

**HORÁRIOS DE ENVIO:**
- Email 1: Imediato após opt-in
- Emails 2-7: 10h da manhã (melhor engajamento)

**AUTOMAÇÃO:**
- Trigger: Lead magnet download
- Filtros: Segmentar por interesse demonstrado
- Tags: Aplicar tags baseadas em comportamento

**MÉTRICAS PARA ACOMPANHAR:**
- **Taxa de abertura:** >25%
- **Taxa de clique:** >3%
- **Taxa de conversão:** 8-15%
- **Taxa de descadastro:** <2%

**OTIMIZAÇÕES:**
□ Testar diferentes assuntos
□ Personalizar baseado em comportamento  
□ Segmentar por engajamento
□ A/B testar horários de envio

**PRÓXIMOS PASSOS:**
□ Configurar automação no ESP
□ Criar landing page de conversão
□ Instalar tracking de conversões
□ Preparar follow-up pós-compra`;
}

function generateGenericCopy(answers: QuizAnswers): string {
  return `✨ COPY PERSONALIZADA PARA SEU NEGÓCIO

PÚBLICO-ALVO: ${answers.target || 'Seu público ideal'}
PRODUTO/SERVIÇO: ${answers.product || 'Sua oferta'}
PRINCIPAL BENEFÍCIO: ${answers.benefit || 'Transformação desejada'}

===== HEADLINE PRINCIPAL =====
${answers.benefit ? 
  `Descubra Como ${answers.benefit} de Forma Garantida!` : 
  'Transforme Sua Vida com Nosso Método Exclusivo!'}

===== COPY PERSUASIVA =====

Olá, ${answers.target || 'futuro cliente'}!

Você está cansado(a) de ${answers.pain || 'não conseguir os resultados que deseja'}?

Eu entendo perfeitamente sua frustração...

Mas tenho uma ótima notícia: existe uma solução comprovada para seu problema!

Apresento: ${answers.product || 'Nossa Solução Revolucionária'}

✅ ${answers.benefit || 'Resultados garantidos'}
✅ ${answers.differential || 'Método exclusivo'}  
✅ Suporte completo incluído
✅ Garantia incondicional

OFERTA ESPECIAL:
Por apenas R$ 497 (em vez de R$ 997)

[BOTÃO: QUERO MINHA TRANSFORMAÇÃO]

Não perca esta oportunidade única!

===== PRÓXIMOS PASSOS =====
□ Adapte esta copy para seu formato específico
□ Adicione elementos visuais atraentes
□ Teste diferentes versões
□ Acompanhe métricas de conversão`;
}

// Função principal que chama N8n ou fallback
export function generateCopy(answers: Record<string, string>, quizType: string): { title: string; content: string } {
  // Para compatibilidade com o sistema atual, mantemos esta função
  return generateCopyFallback(answers as QuizAnswers, quizType);
}
