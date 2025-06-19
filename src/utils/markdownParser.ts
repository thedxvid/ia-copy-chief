
// Função para converter markdown básico em HTML
export const parseMarkdown = (text: string): string => {
  if (!text) return '';
  
  let parsedText = text;
  
  // Converter **texto** para <strong>texto</strong>
  parsedText = parsedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Converter *texto* para <em>texto</em>
  parsedText = parsedText.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  
  // Converter quebras de linha para <br>
  parsedText = parsedText.replace(/\n/g, '<br>');
  
  // Converter listas simples - linhas que começam com -
  parsedText = parsedText.replace(/^- (.+)$/gm, '• $1');
  
  return parsedText;
};

// Hook para sanitizar HTML básico (apenas tags permitidas)
export const sanitizeHtml = (html: string): string => {
  // Remove scripts e outras tags perigosas
  const cleanHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  return cleanHtml;
};
