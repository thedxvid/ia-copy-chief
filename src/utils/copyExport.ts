
interface CopyContent {
  landing_page_copy?: any;
  email_campaign?: any;
  social_media_content?: any;
  vsl_script?: string;
  whatsapp_messages?: string[];
  telegram_messages?: string[];
}

interface CopyData {
  id: string;
  title: string;
  type: string;
  date: string;
  status: string;
  performance: string;
  content?: CopyContent;
  product?: {
    name: string;
    niche: string;
    sub_niche?: string;
  };
}

const generateFileName = (copyData: CopyData, extension: string): string => {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const title = copyData.title
    .replace(/[^a-z0-9\s]/gi, '') // Remove caracteres especiais
    .replace(/\s+/g, '_') // Substitui espaços por underscores
    .toLowerCase()
    .substring(0, 50); // Limita o tamanho
  
  return `${title}_${date}.${extension}`;
};

export const downloadCopyAsText = (copyData: CopyData) => {
  let content = `${copyData.title}\n`;
  content += `${'='.repeat(copyData.title.length)}\n\n`;
  
  content += `📊 INFORMAÇÕES GERAIS\n`;
  content += `${'-'.repeat(25)}\n`;
  content += `Tipo: ${copyData.type}\n`;
  content += `Data de Criação: ${copyData.date}\n`;
  content += `Status: ${copyData.status}\n`;
  content += `Performance: ${copyData.performance}\n\n`;

  if (copyData.product) {
    content += `🎯 PRODUTO\n`;
    content += `${'-'.repeat(25)}\n`;
    content += `Nome: ${copyData.product.name}\n`;
    content += `Nicho: ${copyData.product.niche}\n`;
    if (copyData.product.sub_niche) {
      content += `Sub-nicho: ${copyData.product.sub_niche}\n`;
    }
    content += `\n`;
  }

  if (copyData.content) {
    content += `📝 CONTEÚDO DA COPY\n`;
    content += `${'-'.repeat(25)}\n\n`;

    if (copyData.content.landing_page_copy) {
      content += `🎯 LANDING PAGE:\n`;
      const lp = copyData.content.landing_page_copy;
      if (lp.headline) content += `\n📢 Headline:\n${lp.headline}\n`;
      if (lp.subheadline) content += `\n📝 Subheadline:\n${lp.subheadline}\n`;
      if (lp.body) content += `\n📄 Corpo:\n${lp.body}\n`;
      if (lp.cta) content += `\n🔥 Call to Action:\n${lp.cta}\n`;
      content += `\n${'-'.repeat(50)}\n\n`;
    }

    if (copyData.content.email_campaign) {
      content += `📧 EMAIL MARKETING:\n`;
      const email = copyData.content.email_campaign;
      if (email.subject) content += `\n📌 Assunto:\n${email.subject}\n`;
      if (email.body) content += `\n📄 Corpo:\n${email.body}\n`;
      if (email.cta) content += `\n🔥 Call to Action:\n${email.cta}\n`;
      content += `\n${'-'.repeat(50)}\n\n`;
    }

    if (copyData.content.vsl_script) {
      content += `🎬 SCRIPT DE VENDAS:\n`;
      content += `\n${copyData.content.vsl_script}\n`;
      content += `\n${'-'.repeat(50)}\n\n`;
    }

    if (copyData.content.whatsapp_messages && copyData.content.whatsapp_messages.length > 0) {
      content += `💬 MENSAGENS WHATSAPP:\n`;
      copyData.content.whatsapp_messages.forEach((message, index) => {
        content += `\n📱 Mensagem ${index + 1}:\n${message}\n`;
      });
      content += `\n${'-'.repeat(50)}\n\n`;
    }

    if (copyData.content.telegram_messages && copyData.content.telegram_messages.length > 0) {
      content += `✈️ MENSAGENS TELEGRAM:\n`;
      copyData.content.telegram_messages.forEach((message, index) => {
        content += `\n📱 Mensagem ${index + 1}:\n${message}\n`;
      });
      content += `\n${'-'.repeat(50)}\n\n`;
    }

    if (copyData.content.social_media_content) {
      content += `📱 CONTEÚDO REDES SOCIAIS:\n`;
      const social = copyData.content.social_media_content;
      if (social.headlines) {
        content += `\n🏷️ Headlines:\n`;
        social.headlines.forEach((headline: string, index: number) => {
          content += `${index + 1}. ${headline}\n`;
        });
      }
      if (social.posts) {
        content += `\n📝 Posts:\n`;
        social.posts.forEach((post: string, index: number) => {
          content += `\nPost ${index + 1}:\n${post}\n`;
        });
      }
      content += `\n${'-'.repeat(50)}\n\n`;
    }
  }

  content += `\n📋 GERADO EM: ${new Date().toLocaleString('pt-BR')}\n`;
  content += `🚀 Criado com CopyWriter AI\n`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = generateFileName(copyData, 'txt');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadCopyAsJSON = (copyData: CopyData) => {
  const exportData = {
    ...copyData,
    exported_at: new Date().toISOString(),
    exported_by: 'CopyWriter AI',
    version: '1.0'
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
    type: 'application/json;charset=utf-8' 
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = generateFileName(copyData, 'json');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    // Fallback para navegadores mais antigos
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    } catch (fallbackErr) {
      console.error('Fallback copy failed: ', fallbackErr);
      return false;
    }
  }
};
