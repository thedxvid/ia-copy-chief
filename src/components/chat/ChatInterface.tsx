import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { flushSync } from 'react-dom';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { AgentSelector } from './AgentSelector';
import { useChatAgent } from '@/hooks/useChatAgent';
import { ProductSelector } from '@/components/ui/product-selector';
import { useProducts } from '@/hooks/useProducts';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Trash2, MessageSquare, Menu, X, ArrowDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { useLocation, useNavigate } from 'react-router-dom';
import { AgentEditor } from '@/components/agents/AgentEditor';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import { useScrollPreservation } from '@/hooks/useScrollPreservation';
import { MarkdownText } from '@/components/ui/markdown-text';
import { TokenUpgradeModal } from '@/components/tokens/TokenUpgradeModal';
import { useTokens } from '@/hooks/useTokens';

export const ChatInterface = () => {
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isAgentEditorOpen, setIsAgentEditorOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showTokenUpgrade, setShowTokenUpgrade] = useState(false);
  const [isUpdatingSession, setIsUpdatingSession] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);
  const sessionIdRef = useRef<string | null>(null);
  const isAutoScrollingRef = useRef(false);
  const forceScrollToBottomRef = useRef(false);
  
  const { products } = useProducts();
  const { tokens, refreshTokens } = useTokens();
  const {
    saveScrollPosition,
    restoreScrollPosition,
    setPreserveOnNextRender,
    shouldPreserve,
    setContainerRef,
    isAtBottom: scrollIsAtBottom
  } = useScrollPreservation();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    sessions,
    activeSession,
    createNewSession,
    selectSession,
    deleteSession,
    sendMessage,
    regenerateLastMessage,
    isLoading,
    selectedAgent,
    setSelectedAgent
  } = useChatAgent(selectedProductId);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Hook para preservar scroll após mudanças de sessão
  useLayoutEffect(() => {
    if (messagesContainerRef.current) {
      setContainerRef(messagesContainerRef.current);
    }
  }, [setContainerRef]);

  // CONTROLE DE MUDANÇA DE SESSÃO SEM RESET DE SCROLL
  useEffect(() => {
    const currentSessionId = activeSession?.id;
    
    // Apenas logar mudanças, SEM forçar scroll
    if (sessionIdRef.current && currentSessionId !== sessionIdRef.current) {
      console.log('🔄 Session changed:', {
        from: sessionIdRef.current,
        to: currentSessionId,
        preserveFlag: shouldPreserve()
      });
      
      // NUNCA forçar restauração aqui - deixar o componente natural
    }
    
    sessionIdRef.current = currentSessionId || null;
  }, [activeSession?.id]);

  // Verificar se há um sessionId no state da navegação
  useEffect(() => {
    if (location.state?.sessionId && sessions.length > 0) {
      const sessionToSelect = sessions.find(s => s.id === location.state.sessionId);
      if (sessionToSelect) {
        selectSession(sessionToSelect.id);
        console.log('Sessão selecionada via navegação:', sessionToSelect.id);
      }
    }
  }, [location.state, sessions, selectSession]);

  // Função para verificar se está no final do scroll
  const isAtBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = container;
    const threshold = 50;
    return scrollHeight - scrollTop - clientHeight <= threshold;
  }, []);

  // ESTRATÉGIA AGRESSIVA DE PRESERVAÇÃO DE SCROLL
  const handleSendMessage = useCallback(async (message: string) => {
    // Detectar se está no final ANTES de enviar
    const wasAtBottom = isAtBottom();
    
    console.log('📌 ANTES de enviar - Estado do scroll:', {
      wasAtBottom,
      timestamp: new Date().toLocaleTimeString()
    });
    
    // Se está no final, ativar modo de força para manter no final
    if (wasAtBottom) {
      isAutoScrollingRef.current = true;
      forceScrollToBottomRef.current = true;
      console.log('🔥 ATIVANDO modo força scroll para final');
    } else {
      saveScrollPosition();
      console.log('💾 Salvando posição atual para restaurar');
    }

    // Verificar tokens
    if (!tokens || tokens.total_available <= 0) {
      setShowTokenUpgrade(true);
      return;
    }

    try {
      // Enviar mensagem
      await sendMessage(message);
      flushSync(() => {}); // Forçar sincronização do DOM
      
      // ESTRATÉGIA MÚLTIPLA para garantir scroll
      if (wasAtBottom) {
        // Múltiplas tentativas de scroll para o final
        const scrollToEnd = () => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
            console.log('🚀 Executando scroll forçado para o final');
          }
        };
        
        // Executar scroll em múltiplos momentos
        scrollToEnd(); // Imediato
        requestAnimationFrame(scrollToEnd); // Próximo frame
        requestAnimationFrame(() => requestAnimationFrame(scrollToEnd)); // Frame seguinte
        
        // Também depois de um pequeno delay
        setTimeout(scrollToEnd, 100);
        setTimeout(scrollToEnd, 200);
        setTimeout(scrollToEnd, 500);
      } else {
        // Restaurar posição se não estava no final
        requestAnimationFrame(() => {
          restoreScrollPosition();
          console.log('🔒 Restaurando posição salva');
        });
      }
      
      await refreshTokens();
      
    } catch (error: any) {
      if (error?.message?.includes('créditos') || 
          error?.message?.includes('tokens') ||
          error?.status === 402) {
        setShowTokenUpgrade(true);
      } else {
        throw error;
      }
    }
  }, [sendMessage, tokens, refreshTokens, isAtBottom, saveScrollPosition, restoreScrollPosition]);

  // INTERCEPTADOR AGRESSIVO DE SCROLL INDESEJADO
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;
    let lastScrollTop = container.scrollTop;
    
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const isCurrentlyAtBottom = scrollIsAtBottom(container);
        const { scrollHeight, clientHeight } = container;
        const hasScrollableContent = scrollHeight > clientHeight + 100;
        
        setShowScrollButton(!isCurrentlyAtBottom && hasScrollableContent);
      }, 100);
    };

    // INTERCEPTADOR SUPER AGRESSIVO
    const handleScrollChange = () => {
      const currentScrollTop = container.scrollTop;
      const { scrollHeight, clientHeight } = container;
      
      // Se deve estar forçando o scroll para o final
      if (forceScrollToBottomRef.current) {
        const isAtEnd = scrollHeight - currentScrollTop - clientHeight <= 50;
        
        if (!isAtEnd) {
          console.log('🔄 INTERCEPTANDO scroll indesejado, FORÇANDO volta ao final');
          container.scrollTop = scrollHeight - clientHeight;
        }
      }
      
      // Detectar qualquer scroll para o topo durante auto-scrolling
      if (isAutoScrollingRef.current && currentScrollTop === 0 && scrollHeight > clientHeight + 100) {
        console.log('🚨 DETECTADO scroll para topo durante auto-scroll, CORRIGINDO');
        container.scrollTop = scrollHeight - clientHeight;
      }
      
      lastScrollTop = currentScrollTop;
    };

    // Adicionar múltiplos listeners para capturar todos os scrolls
    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('scroll', handleScrollChange, { passive: false });
    
    // Observer para mudanças no DOM que podem causar scroll
    const observer = new MutationObserver(() => {
      if (forceScrollToBottomRef.current && messagesEndRef.current) {
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
        });
      }
    });
    
    observer.observe(container, { 
      childList: true, 
      subtree: true, 
      attributes: false 
    });
    
    handleScroll();
    
    return () => {
      clearTimeout(scrollTimeout);
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('scroll', handleScrollChange);
      observer.disconnect();
    };
  }, [activeSession?.id, scrollIsAtBottom]);

  // AUTO-SCROLL AGRESSIVO PARA RESPOSTAS
  useLayoutEffect(() => {
    if (!activeSession?.messages.length) {
      lastMessageCountRef.current = 0;
      return;
    }
    
    const currentMessageCount = activeSession.messages.length;
    const hasNewMessages = currentMessageCount > lastMessageCountRef.current;
    
    if (!hasNewMessages) {
      lastMessageCountRef.current = currentMessageCount;
      return;
    }
    
    const lastMessage = activeSession.messages[activeSession.messages.length - 1];
    const isFromAssistant = lastMessage?.role === 'assistant';
    const isFromUser = lastMessage?.role === 'user';
    
    console.log('🎯 Nova mensagem detectada:', {
      messageRole: lastMessage?.role,
      isFromAssistant,
      isFromUser,
      autoScrolling: isAutoScrollingRef.current,
      forceScroll: forceScrollToBottomRef.current,
      messageCount: currentMessageCount
    });
    
    if (isFromUser) {
      console.log('📝 Mensagem do usuário - mantendo configuração de força');
      // Manter a configuração de força ativa para a resposta que virá
    } else if (isFromAssistant) {
      if (forceScrollToBottomRef.current && messagesEndRef.current) {
        console.log('🚀 FORÇA MÁXIMA: Scrolling para resposta do assistant');
        
        // Múltiplas tentativas agressivas
        const forceScroll = () => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
          }
        };
        
        forceScroll();
        requestAnimationFrame(forceScroll);
        requestAnimationFrame(() => requestAnimationFrame(forceScroll));
        setTimeout(forceScroll, 100);
        setTimeout(forceScroll, 200);
        setTimeout(forceScroll, 500);
        
        // Desativar modo força após 1 segundo
        setTimeout(() => {
          forceScrollToBottomRef.current = false;
          isAutoScrollingRef.current = false;
          console.log('✅ Desativando modo força scroll');
        }, 1000);
      }
    }
    
    lastMessageCountRef.current = currentMessageCount;
  }, [activeSession?.messages]);


  // Função para fechar modal e atualizar tokens
  const handleCloseTokenUpgrade = async () => {
    setShowTokenUpgrade(false);
    await refreshTokens();
  };

  // Função para scroll suave até o final
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Função para fechar sidebar no mobile ao selecionar sessão
  const handleSelectSession = (sessionId: string) => {
    selectSession(sessionId);
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  // Função para criar nova sessão e fechar sidebar no mobile
  const handleCreateNewSession = () => {
    createNewSession();
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  // Função para abrir gerenciamento de agentes
  const handleManageAgents = () => {
    navigate('/agents');
  };

  // COMPONENTE ESTÁVEL DE MENSAGENS - Key fixa para evitar re-mount
  const messagesListKey = `messages-${activeSession?.id || 'empty'}`;
  
  const ChatMessagesWithData = () => {
    if (!activeSession) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-[#666666]">
            <h3 className="text-xl font-medium mb-2">Bem-vindo ao Chat IA</h3>
            <p>Selecione um agente e crie uma nova conversa para começar</p>
          </div>
        </div>
      );
    }

    return (
      <div 
        key={messagesListKey}
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4"
        style={{ scrollBehavior: 'auto' }}
      >
        {activeSession.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-[#CCCCCC]">
              <div className="w-12 h-12 mx-auto mb-4 opacity-50">🤖</div>
              <p className="text-lg font-medium mb-2">Bem-vindo ao Chat com IA!</p>
              <p className="text-sm">Comece sua conversa digitando uma mensagem.</p>
            </div>
          </div>
        ) : (
          <>
            <div key={`messages-list-${activeSession.id}`}>
              {activeSession.messages.map((message) => (
                <div
                  key={`${message.id}-${message.timestamp.getTime()}`}
                  className={`flex items-start space-x-3 mb-4 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-[#3B82F6] rounded-2xl flex items-center justify-center">
                      <span className="text-white text-sm">🤖</span>
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-[#3B82F6] text-white'
                        : 'bg-[#1E1E1E] text-white border border-[#4B5563]'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <MarkdownText className="whitespace-pre-wrap">
                        {message.content}
                      </MarkdownText>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                    <div className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-[#4B5563] rounded-2xl flex items-center justify-center">
                      <span className="text-white text-sm">👤</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {isLoading && (
              <div className="flex items-start space-x-3 mb-4">
                <div className="flex-shrink-0 w-8 h-8 bg-[#3B82F6] rounded-2xl flex items-center justify-center">
                  <span className="text-white text-sm">🤖</span>
                </div>
                <div className="bg-[#1E1E1E] text-white border border-[#4B5563] p-4 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-[#3B82F6] rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-[#3B82F6] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-[#3B82F6] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-[#CCCCCC]">Gerando resposta...</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Elemento invisível para marcar o final das mensagens */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    );
  };

  // Sidebar Component
  const Sidebar = () => (
    <div className={`${
      isMobile 
        ? `fixed inset-0 z-50 bg-[#1A1A1A] transform transition-transform duration-300 ${
            showSidebar ? 'translate-x-0' : '-translate-x-full'
          }`
        : 'w-80 bg-[#1A1A1A] border-r border-[#333333]'
    } flex flex-col`}>
      {/* Header da Sidebar */}
      <div className="p-4 border-b border-[#333333]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Conversas</h2>
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(false)}
              className="text-white hover:bg-[#2A2A2A] p-1"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        
        <ProductSelector
          value={selectedProductId}
          onValueChange={setSelectedProductId}
          showPreview={false}
          className="mb-4"
        />

        {selectedProduct && (
          <Alert className="bg-green-500/10 border-green-500/20 mb-4 rounded-2xl">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-200">
              ✅ Contexto ativo: {selectedProduct.name}
            </AlertDescription>
          </Alert>
        )}
        
        <AgentSelector
          selectedAgent={selectedAgent}
          onAgentChange={setSelectedAgent}
          onManageAgents={handleManageAgents}
        />
        
        <button
          onClick={handleCreateNewSession}
          className="w-full mt-4 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-2xl transition-colors"
        >
          Nova Conversa
        </button>
      </div>
      
      {/* Lista de Sessões */}
      <div className="flex-1 overflow-y-auto p-2">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`group relative p-3 mb-2 rounded-2xl cursor-pointer transition-colors ${
              activeSession?.id === session.id
                ? 'bg-[#3B82F6] text-white'
                : 'bg-[#2A2A2A] text-[#CCCCCC] hover:bg-[#333333]'
            }`}
          >
            <div
              onClick={() => handleSelectSession(session.id)}
              className="flex-1"
            >
              <div className="font-medium text-sm pr-8">
                {session.title || 'Nova conversa'}
              </div>
              <div className="text-xs opacity-70 mt-1">
                {new Date(session.created_at).toLocaleDateString('pt-BR')}
              </div>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteSession(session.id);
              }}
              className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-xl transition-all duration-200"
              title="Excluir conversa"
            >
              <Trash2 className="h-3 w-3 text-red-400 hover:text-red-300" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-2rem)] bg-[#0A0A0A] text-white rounded-3xl overflow-hidden relative">
      {/* Sidebar */}
      <Sidebar />

      {/* Overlay para mobile */}
      {isMobile && showSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Área principal do chat */}
      <div className={`flex-1 flex flex-col ${isMobile ? 'w-full' : ''} relative`}>
        {/* Header do chat para mobile */}
        {isMobile && (
          <div className="flex items-center justify-between p-4 border-b border-[#333333]">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(true)}
              className="text-white hover:bg-[#2A2A2A] p-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#3B82F6]" />
              <span className="text-white font-medium">
                {activeSession?.title || 'Chat IA'}
              </span>
            </div>
            <div className="w-8" />
          </div>
        )}

        <ChatMessagesWithData />
        
        {/* Botão flutuante para scroll - movido mais para cima */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className={`absolute bottom-32 left-1/2 transform -translate-x-1/2 z-30 w-10 h-10 rounded-full transition-all duration-300 flex items-center justify-center ${
              showScrollButton ? 'opacity-30 hover:opacity-70 scale-100' : 'opacity-0 scale-95'
            }`}
            title="Ir para o final da conversa"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              color: 'white',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(2px)'
            }}
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        )}
        
        {activeSession && (
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            disabled={!activeSession || !selectedAgent}
          />
        )}
      </div>

      {/* Agent Editor Modal */}
      <AgentEditor
        isOpen={isAgentEditorOpen}
        onClose={() => setIsAgentEditorOpen(false)}
      />

      {/* Token Upgrade Modal */}
      <TokenUpgradeModal
        isOpen={showTokenUpgrade}
        onClose={handleCloseTokenUpgrade}
        tokensRemaining={tokens?.total_available || 0}
        isOutOfTokens={!tokens || tokens.total_available <= 0}
      />
    </div>
  );
};
