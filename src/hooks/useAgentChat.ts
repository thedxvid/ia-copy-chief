
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatHistory {
  [agentId: string]: Message[];
}

export const useAgentChat = (agentId: string) => {
  // Validação e logging detalhado do agentId
  useEffect(() => {
    console.log('🔄 useAgentChat INICIALIZADO para agente:', agentId);
    console.log('🔍 Tipo do agentId:', typeof agentId, 'Valor:', agentId);
    
    if (!agentId) {
      console.error('❌ ERRO CRÍTICO: agentId é inválido!', agentId);
    }
  }, [agentId]);

  const [messages, setMessages] = useState<Message[]>(() => {
    // Garantir que agentId seja válido antes de acessar localStorage
    if (!agentId) {
      console.error('❌ agentId inválido no useState inicial:', agentId);
      return [];
    }

    const storageKey = `chat-${agentId}`;
    const saved = localStorage.getItem(storageKey);
    const parsed = saved ? JSON.parse(saved) : [];
    
    console.log(`💾 CARREGANDO HISTÓRICO para agente [${agentId}]:`);
    console.log(`📁 Chave do localStorage: ${storageKey}`);
    console.log(`📊 Mensagens encontradas: ${parsed.length}`);
    console.log('📝 Preview das mensagens:', parsed.slice(-2).map(m => ({
      role: m.role,
      content: m.content?.substring(0, 50) + '...',
      timestamp: m.timestamp
    })));
    
    return parsed;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const { user } = useAuth();

  const saveToStorage = useCallback((msgs: Message[]) => {
    if (!agentId) {
      console.error('❌ Tentativa de salvar sem agentId válido:', agentId);
      return;
    }

    const storageKey = `chat-${agentId}`;
    localStorage.setItem(storageKey, JSON.stringify(msgs));
    console.log(`💾 SALVO: ${msgs.length} mensagens para [${agentId}] na chave ${storageKey}`);
  }, [agentId]);

  const triggerWebhook = useCallback(async (userMessage: string, agentName: string) => {
    try {
      const webhookUrl = 'https://n8n.srv830837.hstgr.cloud/webhook-test/chat-user-message';
      
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify({
          message: userMessage,
          agentId: agentId,
          agentName: agentName,
          userId: user?.id || 'anonymous',
          timestamp: new Date().toISOString(),
          source: 'agent-chat',
          sessionId: `chat_${agentId}_${Date.now()}`,
          messageCount: messages.length + 1
        }),
      });

      console.log('📡 N8n webhook triggered para agente:', agentName, 'ID:', agentId);
    } catch (error) {
      console.error('❌ Erro no webhook N8n:', error);
    }
  }, [agentId, user?.id, messages.length]);

  const sendMessage = useCallback(async (content: string, agentPrompt: string, agentName?: string, isCustomAgent?: boolean, enableStreaming: boolean = true) => {
    if (!content.trim()) return;

    console.log('=== 📤 ENVIANDO MENSAGEM ===');
    console.log('🤖 Agent ID:', agentId);
    console.log('📝 Content:', content.substring(0, 100) + '...');
    console.log('👤 Agent Name:', agentName);
    console.log('🔧 Is Custom:', isCustomAgent);
    console.log('🆔 User ID:', user?.id);
    console.log('📋 Current message count:', messages.length);
    console.log('🎯 Storage Key que será usado:', `chat-${agentId}`);
    console.log('📡 Streaming enabled:', enableStreaming);

    // Validação crítica do agentId
    if (!agentId) {
      console.error('❌ ERRO CRÍTICO: Tentativa de enviar mensagem sem agentId válido!');
      toast.error('Erro: ID do agente inválido');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => {
      const updated = [...prev, userMessage];
      saveToStorage(updated);
      console.log(`✅ Mensagem do usuário adicionada ao histórico de [${agentId}]. Total: ${updated.length}`);
      return updated;
    });

    // Disparar webhook N8n quando usuário envia mensagem
    if (agentName) {
      triggerWebhook(content, agentName);
    }

    setIsLoading(true);
    setStreamingContent('');

    try {
      console.log('=== 🔄 CHAMANDO EDGE FUNCTION ===');
      
      const requestBody = {
        message: content,
        agentPrompt,
        chatHistory: messages,
        agentName: agentName || 'Agente IA',
        isCustomAgent: isCustomAgent || false,
        userId: user?.id,
        streaming: enableStreaming
      };

      console.log('📦 Request body summary:', {
        message: content.substring(0, 50) + '...',
        agentPrompt: agentPrompt ? `${agentPrompt.substring(0, 100)}...` : 'MISSING',
        chatHistoryLength: messages.length,
        agentName,
        isCustomAgent,
        userId: user?.id,
        streaming: enableStreaming
      });

      // Se streaming estiver habilitado, usar Server-Sent Events
      if (enableStreaming) {
        console.log('📡 Iniciando streaming...');
        setIsStreaming(true);
        setIsLoading(false);

        const response = await fetch(`${supabase.supabaseUrl}/functions/v1/chat-with-claude`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabase.supabaseKey}`,
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        // Se a resposta tem Server-Sent Events
        if (response.headers.get('content-type')?.includes('text/event-stream')) {
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let accumulatedContent = '';

          if (reader) {
            try {
              while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;
                
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    
                    try {
                      const parsed = JSON.parse(data);
                      if (parsed.type === 'content' && parsed.text) {
                        accumulatedContent += parsed.text;
                        setStreamingContent(accumulatedContent);
                      }
                    } catch (e) {
                      // Ignorar erros de parsing
                    }
                  }
                }
              }
            } finally {
              reader.releaseLock();
            }
          }

          // Adicionar mensagem final ao histórico
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: accumulatedContent,
            role: 'assistant',
            timestamp: new Date()
          };

          setMessages(prev => {
            const updated = [...prev, assistantMessage];
            saveToStorage(updated);
            return updated;
          });

          setIsStreaming(false);
          setStreamingContent('');
          
          toast.success('💬 Resposta gerada em tempo real!');
          return;
        }
      }

      // Fallback para resposta normal (sem streaming)
      console.log('📞 Usando resposta padrão (sem streaming)');
      
      const { data, error } = await supabase.functions.invoke('chat-with-claude', {
        body: requestBody
      });

      console.log('=== 📨 RESPOSTA DA EDGE FUNCTION ===');
      console.log('❌ Error:', error);
      console.log('✅ Data:', data);

      if (error) {
        console.error('❌ Edge function error:', error);
        
        // **Tratamento específico para tokens insuficientes**
        if (error.message?.includes('Tokens insuficientes') || 
            error.details?.includes('tokens') || 
            error.context?.status === 402) {
          toast.error('❌ Tokens Insuficientes!', {
            description: 'Você não tem tokens suficientes para esta conversa. Aguarde o reset mensal ou economize tokens.',
            duration: 8000,
          });
          
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: '❌ **Tokens Insuficientes**\n\nDesculpe, você não tem tokens suficientes para continuar esta conversa. Seus tokens serão renovados no início do próximo mês (dia 1º).\n\n💡 **Dicas para economizar:**\n- Seja mais direto nas perguntas\n- Evite conversas muito longas\n- Use comandos específicos',
            role: 'assistant',
            timestamp: new Date()
          };

          setMessages(prev => {
            const updated = [...prev, errorMessage];
            saveToStorage(updated);
            return updated;
          });
          
          return;
        }

        // **Tratamento para configuração incompleta**
        if (error.message?.includes('ambiente incompleta') || 
            error.message?.includes('ANTHROPIC_API_KEY') ||
            error.context?.status === 503) {
          toast.error('❌ Configuração Incompleta!', {
            description: 'A chave da API do Claude não está configurada. Entre em contato com o suporte.',
            duration: 8000,
          });
          
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: '❌ **Configuração Incompleta**\n\nDesculpe, há um problema na configuração do sistema. A chave da API do Claude não está configurada corretamente.\n\n🔧 **O que fazer:**\n- Entre em contato com o suporte\n- Aguarde a correção da configuração\n- Tente novamente em alguns minutos',
            role: 'assistant',
            timestamp: new Date()
          };

          setMessages(prev => {
            const updated = [...prev, errorMessage];
            saveToStorage(updated);
            return updated;
          });
          
          return;
        }

        // **Tratamento para erro de validação da API (400)**
        if (error.context?.status === 400 || error.message?.includes('400')) {
          toast.error('❌ Erro de Validação!', {
            description: 'Erro na estrutura da mensagem. Tente reformular sua pergunta.',
            duration: 6000,
          });
          
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: '❌ **Erro de Validação**\n\nOcorreu um erro na estrutura da mensagem enviada. Tente reformular sua pergunta de forma mais simples ou direta.\n\n💭 **Dica:**\nTente ser mais específico em sua pergunta e evite caracteres especiais.',
            role: 'assistant',
            timestamp: new Date()
          };

          setMessages(prev => {
            const updated = [...prev, errorMessage];
            saveToStorage(updated);
            return updated;
          });
          
          return;
        }
        
        throw new Error(error.message || 'Falha na comunicação com o agente');
      }

      console.log('✅ Edge function response recebida:', data);
      
      // **Verificar se há resposta válida**
      if (!data || !data.response) {
        throw new Error('Resposta inválida do agente');
      }
      
      // **Mostrar feedback sobre tokens usados**
      if (data.tokensUsed) {
        const remainingTokens = data.tokensRemaining || 0;
        
        if (remainingTokens < 1000) {
          toast.warning(`💬 Resposta gerada! (${data.tokensUsed} tokens usados)`, {
            description: `⚠️ Atenção: Restam apenas ${remainingTokens} tokens. Considere economizar.`,
            duration: 6000,
          });
        } else if (data.tokensUsed > 500) {
          toast.info(`💬 Resposta gerada! (${data.tokensUsed} tokens usados)`, {
            description: `Restam ${remainingTokens.toLocaleString()} tokens disponíveis.`,
            duration: 4000,
          });
        } else {
          toast.success(`💬 Resposta gerada! (${data.tokensUsed} tokens usados)`, {
            duration: 3000,
          });
        }
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date()
      };

      console.log(`💬 Resposta do assistente recebida para agente [${agentId}]:`, agentName);
      console.log('📄 Preview da resposta:', data.response.substring(0, 100) + '...');

      setMessages(prev => {
        const updated = [...prev, assistantMessage];
        saveToStorage(updated);
        console.log(`✅ Chat atualizado para agente [${agentId}]. Total de mensagens: ${updated.length}`);
        return updated;
      });
    } catch (error) {
      console.error('=== ❌ ERRO AO ENVIAR MENSAGEM ===');
      console.error('Erro detalhado:', error);
      
      // Verificar se é erro de tokens
      if (error.message?.includes('tokens') || error.message?.includes('402')) {
        toast.error('❌ Tokens Insuficientes!', {
          description: 'Você não tem tokens suficientes para esta operação.',
          duration: 6000,
        });
      } else if (error.message?.includes('ambiente') || error.message?.includes('configuração')) {
        toast.error('❌ Problema de Configuração!', {
          description: 'Há um problema na configuração do sistema. Tente novamente em alguns minutos.',
          duration: 6000,
        });
      } else {
        toast.error('❌ Erro no Chat', {
          description: 'Erro ao enviar mensagem. Verifique sua conexão e tente novamente.',
          duration: 5000,
        });
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: error.message?.includes('tokens') 
          ? '❌ **Tokens Insuficientes**\n\nDesculpe, você não tem tokens suficientes para continuar o chat. Seus tokens serão renovados no início do próximo mês.'
          : error.message?.includes('configuração') || error.message?.includes('ambiente')
          ? '❌ **Problema de Configuração**\n\nDesculpe, há um problema temporário na configuração do sistema. Tente novamente em alguns minutos.'
          : '❌ **Erro Temporário**\n\nDesculpe, ocorreu um erro ao processar sua mensagem. Verifique sua conexão e tente novamente.',
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => {
        const updated = [...prev, errorMessage];
        saveToStorage(updated);
        return updated;
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingContent('');
    }
  }, [messages, saveToStorage, triggerWebhook, user?.id, agentId]);

  const clearChat = useCallback(() => {
    console.log(`🗑️ LIMPANDO chat para agente: [${agentId}]`);
    const storageKey = `chat-${agentId}`;
    setMessages([]);
    localStorage.removeItem(storageKey);
    console.log(`✅ Chat limpo: chave ${storageKey} removida do localStorage`);
  }, [agentId]);

  const exportChat = useCallback((agentName: string) => {
    const chatContent = messages.map(msg => 
      `${msg.role === 'user' ? 'Você' : agentName}: ${msg.content}`
    ).join('\n\n');
    
    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversa-${agentName}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [messages]);

  return {
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    sendMessage,
    clearChat,
    exportChat
  };
};
