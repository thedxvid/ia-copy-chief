
import { QuizAnswers } from '@/contexts/AppContext';

export function generateCopy(answers: QuizAnswers) {
  const adCopy = generateAdCopy(answers);
  const videoScript = generateVideoScript(answers);
  
  return { adCopy, videoScript };
}

function generateAdCopy(answers: QuizAnswers): string {
  const templates = [
    `🔥 ATENÇÃO ${answers.target?.toUpperCase() || 'VOCÊ QUE QUER MUDAR DE VIDA'}!

Você está cansado(a) de ${answers.pain?.toLowerCase() || 'não conseguir os resultados que deseja'}?

Finalmente chegou a solução que você estava esperando! 

✅ ${answers.product || 'Nossa solução revolucionária'}

🎯 O que você vai conseguir:
${answers.benefit || 'Transformação completa em sua vida'}

💡 Nosso diferencial único:
${answers.differential || 'Método exclusivo comprovado'}

⚡ OFERTA ESPECIAL por tempo limitado!

👆 CLIQUE AGORA e garante sua vaga antes que seja tarde!

💬 Já temos centenas de pessoas transformando suas vidas!

#${answers.objective?.replace(/\s+/g, '') || 'Transformacao'} #Resultados #VidaNova`,

    `PARE TUDO! 🛑

Se você é ${answers.target?.toLowerCase() || 'alguém que busca resultados'}, essa mensagem pode mudar sua vida.

Imagina como seria ${answers.benefit?.toLowerCase() || 'ter os resultados que sempre sonhou'}?

Apresento para você: ${answers.product || 'A solução definitiva'}

✨ Por que somos diferentes?
${answers.differential || 'Temos um método único e comprovado'}

🚫 Chega de ${answers.pain?.toLowerCase() || 'sofrer com problemas sem solução'}!

🎯 Essa é SUA oportunidade de mudar tudo!

ÚLTIMAS VAGAS DISPONÍVEIS!

Clique no link e garanta já a sua! 👇

P.S.: Não deixe para amanhã o que pode transformar sua vida hoje!`,

    `🎯 REVELADO: O segredo que ${answers.target?.toLowerCase() || 'pessoas como você'} estão usando para ${answers.benefit?.toLowerCase() || 'alcançar resultados incríveis'}

Depois de anos estudando o que realmente funciona, descobri que o problema não é ${answers.pain?.toLowerCase() || 'falta de informação'}...

O problema é NÃO ter um método SIMPLES e EFICAZ!

Por isso criei: ${answers.product || 'Este sistema revolucionário'}

🔍 Nosso diferencial:
${answers.differential || 'Abordagem única no mercado'}

📈 Resultado garantido ou seu dinheiro de volta!

⭐ Mais de 1.000 pessoas já transformaram suas vidas!

🔥 PROMOÇÃO RELÂMPAGO: 
Apenas hoje com desconto especial!

👆 CLIQUE AQUI e comece sua transformação AGORA!

Vagas limitadas - Não perca essa oportunidade única!`
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

function generateVideoScript(answers: QuizAnswers): string {
  return `🎬 ROTEIRO DE VÍDEO - ${answers.product || 'SEU PRODUTO'}

📱 DURAÇÃO: 60-90 segundos
🎯 OBJETIVO: ${answers.objective || 'Gerar conversões'}

---

[0-3s] HOOK INICIAL:
"Se você é ${answers.target?.toLowerCase() || 'alguém que busca resultados'}, NÃO feche esse vídeo!"
*Mostre algo visual impactante*

[4-15s] PROBLEMA:
"Eu sei como é frustrante ${answers.pain?.toLowerCase() || 'não conseguir os resultados que quer'}..."
"Você já tentou de tudo, mas nada funcionou, certo?"
*Conecte com a dor do público*

[16-35s] APRESENTAÇÃO DA SOLUÇÃO:
"Por isso criei ${answers.product || 'esta solução revolucionária'}..."
"Que vai te entregar ${answers.benefit?.toLowerCase() || 'os resultados que você sempre quis'}!"
*Apresente o produto/benefício principal*

[36-50s] DIFERENCIAL/PROVA:
"E sabe o que nos torna únicos? ${answers.differential || 'Nossa abordagem exclusiva'}!"
"Já temos mais de 500 pessoas com resultados incríveis!"
*Mostre depoimentos ou resultados*

[51-60s] CALL TO ACTION:
"Clique no link da bio AGORA e garante sua vaga!"
"As inscrições fecham em breve!"
*CTA claro e urgente*

---

💡 DICAS DE GRAVAÇÃO:
• Fale olhando diretamente para a câmera
• Use gestos expressivos
• Mantenha energia alta durante todo o vídeo
• Inclua legendas para maior alcance
• Use músicas que gerem energia/urgência

📊 ELEMENTOS VISUAIS:
• Primeiro plano: Você falando
• Cortes dinâmicos a cada 3-5 segundos
• Textos/emojis reforçando pontos importantes
• Depoimentos ou resultados (se tiver)
• CTA visual no final

🎵 MÚSICA SUGERIDA:
• Instrumental motivacional
• Volume baixo para não competir com sua voz
• Acelerar o ritmo na parte do CTA

---

VARIAÇÃO A/B:
Para testar, grave também começando com:
"Em 60 segundos vou te mostrar como ${answers.benefit?.toLowerCase() || 'transformar sua vida'}..."

Teste qual hook funciona melhor com seu público!`;
}
