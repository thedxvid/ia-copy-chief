
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

export const downloadCopyAsText = (copyData: CopyData) => {
  let content = `${copyData.title}\n`;
  content += `${'='.repeat(copyData.title.length)}\n\n`;
  
  content += `Tipo: ${copyData.type}\n`;
  content += `Data: ${copyData.date}\n`;
  content += `Status: ${copyData.status}\n`;
  content += `Performance: ${copyData.performance}\n\n`;

  if (copyData.product) {
    content += `PRODUTO:\n`;
    content += `- Nome: ${copyData.product.name}\n`;
    content += `- Nicho: ${copyData.product.niche}\n`;
    if (copyData.product.sub_niche) {
      content += `- Sub-nicho: ${copyData.product.sub_niche}\n`;
    }
    content += `\n`;
  }

  if (copyData.content) {
    content += `CONTEÚDO:\n`;
    content += `---------\n\n`;

    if (copyData.content.landing_page_copy) {
      content += `Landing Page Copy:\n`;
      content += JSON.stringify(copyData.content.landing_page_copy, null, 2);
      content += `\n\n`;
    }

    if (copyData.content.email_campaign) {
      content += `Email Campaign:\n`;
      content += JSON.stringify(copyData.content.email_campaign, null, 2);
      content += `\n\n`;
    }

    if (copyData.content.vsl_script) {
      content += `VSL Script:\n`;
      content += copyData.content.vsl_script;
      content += `\n\n`;
    }

    if (copyData.content.whatsapp_messages && copyData.content.whatsapp_messages.length > 0) {
      content += `WhatsApp Messages:\n`;
      copyData.content.whatsapp_messages.forEach((message, index) => {
        content += `${index + 1}. ${message}\n`;
      });
      content += `\n`;
    }

    if (copyData.content.telegram_messages && copyData.content.telegram_messages.length > 0) {
      content += `Telegram Messages:\n`;
      copyData.content.telegram_messages.forEach((message, index) => {
        content += `${index + 1}. ${message}\n`;
      });
      content += `\n`;
    }

    if (copyData.content.social_media_content) {
      content += `Social Media Content:\n`;
      content += JSON.stringify(copyData.content.social_media_content, null, 2);
      content += `\n\n`;
    }
  }

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${copyData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${copyData.date}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadCopyAsJSON = (copyData: CopyData) => {
  const blob = new Blob([JSON.stringify(copyData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${copyData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${copyData.date}.json`;
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
    return false;
  }
};
