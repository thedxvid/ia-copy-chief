
-- 1. POLÍTICAS PARA A TABELA PROFILES
-- Permitir que usuários leiam seus próprios perfis
CREATE POLICY "Usuários podem ler seu próprio perfil"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Permitir que usuários atualizem seus próprios perfis
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Permitir que usuários insiram seus próprios perfis (para novos registros)
CREATE POLICY "Usuários podem criar seu próprio perfil"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 2. POLÍTICAS PARA A TABELA ADMIN_USERS
-- Apenas admins podem ver outros admins
CREATE POLICY "Admins podem ver outros admins"
ON public.admin_users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  )
);

-- Não permitir inserção direta por usuários normais
-- (inserções devem ser feitas pelo backend com service role key)

-- 3. POLÍTICAS PARA A TABELA PRODUCTS
-- Usuários podem ver apenas seus próprios produtos
CREATE POLICY "Usuários podem ver seus próprios produtos"
ON public.products FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem criar seus próprios produtos
CREATE POLICY "Usuários podem criar seus próprios produtos"
ON public.products FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios produtos
CREATE POLICY "Usuários podem atualizar seus próprios produtos"
ON public.products FOR UPDATE
USING (auth.uid() = user_id);

-- Usuários podem deletar seus próprios produtos
CREATE POLICY "Usuários podem deletar seus próprios produtos"
ON public.products FOR DELETE
USING (auth.uid() = user_id);

-- 4. POLÍTICAS PARA A TABELA PRODUCT_STRATEGY
-- Usuários podem ver estratégias de seus próprios produtos
CREATE POLICY "Usuários podem ver estratégias de seus produtos"
ON public.product_strategy FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.products WHERE id = product_strategy.product_id AND user_id = auth.uid()
  )
);

-- Usuários podem criar estratégias para seus próprios produtos
CREATE POLICY "Usuários podem criar estratégias para seus produtos"
ON public.product_strategy FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products WHERE id = product_strategy.product_id AND user_id = auth.uid()
  )
);

-- Usuários podem atualizar estratégias de seus próprios produtos
CREATE POLICY "Usuários podem atualizar estratégias de seus produtos"
ON public.product_strategy FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.products WHERE id = product_strategy.product_id AND user_id = auth.uid()
  )
);

-- Usuários podem deletar estratégias de seus próprios produtos
CREATE POLICY "Usuários podem deletar estratégias de seus produtos"
ON public.product_strategy FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.products WHERE id = product_strategy.product_id AND user_id = auth.uid()
  )
);

-- 5. POLÍTICAS PARA A TABELA PRODUCT_COPY
-- Usuários podem ver copies de seus próprios produtos
CREATE POLICY "Usuários podem ver copies de seus produtos"
ON public.product_copy FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.products WHERE id = product_copy.product_id AND user_id = auth.uid()
  )
);

-- Usuários podem criar copies para seus próprios produtos
CREATE POLICY "Usuários podem criar copies para seus produtos"
ON public.product_copy FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products WHERE id = product_copy.product_id AND user_id = auth.uid()
  )
);

-- Usuários podem atualizar copies de seus próprios produtos
CREATE POLICY "Usuários podem atualizar copies de seus produtos"
ON public.product_copy FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.products WHERE id = product_copy.product_id AND user_id = auth.uid()
  )
);

-- Usuários podem deletar copies de seus próprios produtos
CREATE POLICY "Usuários podem deletar copies de seus produtos"
ON public.product_copy FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.products WHERE id = product_copy.product_id AND user_id = auth.uid()
  )
);

-- 6. POLÍTICAS PARA A TABELA PRODUCT_OFFER
-- Usuários podem ver ofertas de seus próprios produtos
CREATE POLICY "Usuários podem ver ofertas de seus produtos"
ON public.product_offer FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.products WHERE id = product_offer.product_id AND user_id = auth.uid()
  )
);

-- Usuários podem criar ofertas para seus próprios produtos
CREATE POLICY "Usuários podem criar ofertas para seus produtos"
ON public.product_offer FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products WHERE id = product_offer.product_id AND user_id = auth.uid()
  )
);

-- Usuários podem atualizar ofertas de seus próprios produtos
CREATE POLICY "Usuários podem atualizar ofertas de seus produtos"
ON public.product_offer FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.products WHERE id = product_offer.product_id AND user_id = auth.uid()
  )
);

-- Usuários podem deletar ofertas de seus próprios produtos
CREATE POLICY "Usuários podem deletar ofertas de seus produtos"
ON public.product_offer FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.products WHERE id = product_offer.product_id AND user_id = auth.uid()
  )
);

-- 7. POLÍTICAS PARA A TABELA PRODUCT_META
-- Usuários podem ver metadados de seus próprios produtos
CREATE POLICY "Usuários podem ver metadados de seus produtos"
ON public.product_meta FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.products WHERE id = product_meta.product_id AND user_id = auth.uid()
  )
);

-- Usuários podem criar metadados para seus próprios produtos
CREATE POLICY "Usuários podem criar metadados para seus produtos"
ON public.product_meta FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products WHERE id = product_meta.product_id AND user_id = auth.uid()
  )
);

-- Usuários podem atualizar metadados de seus próprios produtos
CREATE POLICY "Usuários podem atualizar metadados de seus produtos"
ON public.product_meta FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.products WHERE id = product_meta.product_id AND user_id = auth.uid()
  )
);

-- Usuários podem deletar metadados de seus próprios produtos
CREATE POLICY "Usuários podem deletar metadados de seus produtos"
ON public.product_meta FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.products WHERE id = product_meta.product_id AND user_id = auth.uid()
  )
);

-- 8. POLÍTICAS PARA A TABELA PRODUCT_ANALYTICS
-- Usuários podem ver analytics de seus próprios produtos
CREATE POLICY "Usuários podem ver analytics de seus produtos"
ON public.product_analytics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.products WHERE id = product_analytics.product_id AND user_id = auth.uid()
  )
);

-- Usuários podem criar analytics para seus próprios produtos
CREATE POLICY "Usuários podem criar analytics para seus produtos"
ON public.product_analytics FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products WHERE id = product_analytics.product_id AND user_id = auth.uid()
  )
);

-- Usuários podem atualizar analytics de seus próprios produtos
CREATE POLICY "Usuários podem atualizar analytics de seus produtos"
ON public.product_analytics FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.products WHERE id = product_analytics.product_id AND user_id = auth.uid()
  )
);

-- Usuários podem deletar analytics de seus próprios produtos
CREATE POLICY "Usuários podem deletar analytics de seus produtos"
ON public.product_analytics FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.products WHERE id = product_analytics.product_id AND user_id = auth.uid()
  )
);

-- 9. POLÍTICAS PARA A TABELA PRODUCT_HISTORY
-- Usuários podem ver histórico de seus próprios produtos
CREATE POLICY "Usuários podem ver histórico de seus produtos"
ON public.product_history FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem criar histórico para suas próprias ações
CREATE POLICY "Usuários podem criar histórico de suas ações"
ON public.product_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 10. POLÍTICAS PARA A TABELA CHAT_SESSIONS
-- Usuários podem ver suas próprias sessões de chat
CREATE POLICY "Usuários podem ver suas próprias sessões de chat"
ON public.chat_sessions FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem criar suas próprias sessões de chat
CREATE POLICY "Usuários podem criar suas próprias sessões de chat"
ON public.chat_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias sessões de chat
CREATE POLICY "Usuários podem atualizar suas próprias sessões de chat"
ON public.chat_sessions FOR UPDATE
USING (auth.uid() = user_id);

-- Usuários podem deletar suas próprias sessões de chat
CREATE POLICY "Usuários podem deletar suas próprias sessões de chat"
ON public.chat_sessions FOR DELETE
USING (auth.uid() = user_id);

-- 11. POLÍTICAS PARA A TABELA CHAT_MESSAGES
-- Usuários podem ver mensagens de suas próprias sessões
CREATE POLICY "Usuários podem ver mensagens de suas sessões"
ON public.chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_sessions WHERE id = chat_messages.session_id AND user_id = auth.uid()
  )
);

-- Usuários podem criar mensagens em suas próprias sessões
CREATE POLICY "Usuários podem criar mensagens em suas sessões"
ON public.chat_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_sessions WHERE id = chat_messages.session_id AND user_id = auth.uid()
  )
);

-- Usuários podem atualizar mensagens de suas próprias sessões
CREATE POLICY "Usuários podem atualizar mensagens de suas sessões"
ON public.chat_messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.chat_sessions WHERE id = chat_messages.session_id AND user_id = auth.uid()
  )
);

-- Usuários podem deletar mensagens de suas próprias sessões
CREATE POLICY "Usuários podem deletar mensagens de suas sessões"
ON public.chat_messages FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.chat_sessions WHERE id = chat_messages.session_id AND user_id = auth.uid()
  )
);

-- 12. POLÍTICAS PARA A TABELA CUSTOM_AGENTS
-- Usuários podem ver seus próprios agentes personalizados
CREATE POLICY "Usuários podem ver seus próprios agentes"
ON public.custom_agents FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem criar seus próprios agentes
CREATE POLICY "Usuários podem criar seus próprios agentes"
ON public.custom_agents FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios agentes
CREATE POLICY "Usuários podem atualizar seus próprios agentes"
ON public.custom_agents FOR UPDATE
USING (auth.uid() = user_id);

-- Usuários podem deletar seus próprios agentes
CREATE POLICY "Usuários podem deletar seus próprios agentes"
ON public.custom_agents FOR DELETE
USING (auth.uid() = user_id);

-- 13. POLÍTICAS PARA A TABELA AGENT_FILES
-- Usuários podem ver arquivos de seus próprios agentes
CREATE POLICY "Usuários podem ver arquivos de seus agentes"
ON public.agent_files FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.custom_agents WHERE id = agent_files.agent_id AND user_id = auth.uid()
  )
);

-- Usuários podem criar arquivos para seus próprios agentes
CREATE POLICY "Usuários podem criar arquivos para seus agentes"
ON public.agent_files FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.custom_agents WHERE id = agent_files.agent_id AND user_id = auth.uid()
  )
);

-- Usuários podem deletar arquivos de seus próprios agentes
CREATE POLICY "Usuários podem deletar arquivos de seus agentes"
ON public.agent_files FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.custom_agents WHERE id = agent_files.agent_id AND user_id = auth.uid()
  )
);

-- 14. POLÍTICAS PARA A TABELA SPECIALIZED_COPIES
-- Usuários podem ver suas próprias copies especializadas
CREATE POLICY "Usuários podem ver suas próprias copies especializadas"
ON public.specialized_copies FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem criar suas próprias copies especializadas
CREATE POLICY "Usuários podem criar suas próprias copies especializadas"
ON public.specialized_copies FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias copies especializadas
CREATE POLICY "Usuários podem atualizar suas próprias copies especializadas"
ON public.specialized_copies FOR UPDATE
USING (auth.uid() = user_id);

-- Usuários podem deletar suas próprias copies especializadas
CREATE POLICY "Usuários podem deletar suas próprias copies especializadas"
ON public.specialized_copies FOR DELETE
USING (auth.uid() = user_id);

-- 15. POLÍTICAS PARA A TABELA QUIZ_COPIES
-- Usuários podem ver suas próprias copies de quiz
CREATE POLICY "Usuários podem ver suas próprias copies de quiz"
ON public.quiz_copies FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem criar suas próprias copies de quiz
CREATE POLICY "Usuários podem criar suas próprias copies de quiz"
ON public.quiz_copies FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias copies de quiz
CREATE POLICY "Usuários podem atualizar suas próprias copies de quiz"
ON public.quiz_copies FOR UPDATE
USING (auth.uid() = user_id);

-- Usuários podem deletar suas próprias copies de quiz
CREATE POLICY "Usuários podem deletar suas próprias copies de quiz"
ON public.quiz_copies FOR DELETE
USING (auth.uid() = user_id);

-- 16. POLÍTICAS PARA A TABELA TOKEN_USAGE
-- Usuários podem ver seu próprio histórico de uso de tokens
CREATE POLICY "Usuários podem ver seu próprio uso de tokens"
ON public.token_usage FOR SELECT
USING (auth.uid() = user_id);

-- Inserções de token_usage são feitas apenas pelas Edge Functions com service role
-- Não é necessário política de INSERT para usuários normais

-- 17. POLÍTICAS PARA A TABELA TOKEN_PURCHASES
-- Usuários podem ver suas próprias compras de tokens
CREATE POLICY "Usuários podem ver suas próprias compras de tokens"
ON public.token_purchases FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem criar suas próprias compras de tokens
CREATE POLICY "Usuários podem criar suas próprias compras de tokens"
ON public.token_purchases FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 18. POLÍTICAS PARA A TABELA TOKEN_PACKAGE_PURCHASES
-- Usuários podem ver suas próprias compras de pacotes
CREATE POLICY "Usuários podem ver suas próprias compras de pacotes"
ON public.token_package_purchases FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem criar suas próprias compras de pacotes
CREATE POLICY "Usuários podem criar suas próprias compras de pacotes"
ON public.token_package_purchases FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 19. POLÍTICAS PARA A TABELA TOKEN_AUDIT_LOGS
-- Apenas admins podem ver logs de auditoria de tokens
CREATE POLICY "Admins podem ver logs de auditoria de tokens"
ON public.token_audit_logs FOR SELECT
USING (public.is_user_admin(auth.uid()));

-- Apenas Edge Functions podem inserir logs de auditoria
-- Não é necessário política de INSERT para usuários normais

-- 20. POLÍTICAS PARA TABELAS PÚBLICAS (QUIZ_TEMPLATES, TOKEN_PACKAGES)
-- Todos os usuários autenticados podem ver templates de quiz ativos
CREATE POLICY "Usuários podem ver templates de quiz ativos"
ON public.quiz_templates FOR SELECT
USING (is_active = true);

-- Todos os usuários autenticados podem ver pacotes de tokens ativos
CREATE POLICY "Usuários podem ver pacotes de tokens ativos"
ON public.token_packages FOR SELECT
USING (is_active = true);

-- 21. GARANTIR QUE RLS ESTÁ HABILITADO EM TODAS AS TABELAS
-- (Algumas já têm RLS habilitado, mas vamos garantir)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_strategy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_copy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_offer ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialized_copies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_copies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_package_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_packages ENABLE ROW LEVEL SECURITY;
