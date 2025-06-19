
import React from 'react';
import { parseMarkdown, sanitizeHtml } from '@/utils/markdownParser';

interface MarkdownTextProps {
  children: string;
  className?: string;
}

export const MarkdownText: React.FC<MarkdownTextProps> = ({ 
  children, 
  className = '' 
}) => {
  const parsedContent = parseMarkdown(children);
  const sanitizedContent = sanitizeHtml(parsedContent);
  
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};
