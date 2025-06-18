
-- Criar tabela para templates de quiz editáveis
CREATE TABLE public.quiz_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Garantir que só existe um template padrão ativo por tipo de quiz
  CONSTRAINT unique_default_per_type EXCLUDE (quiz_type WITH =) WHERE (is_default = true AND is_active = true)
);

-- Adicionar RLS
ALTER TABLE public.quiz_templates ENABLE ROW LEVEL SECURITY;

-- Política para admins poderem ver todos os templates
CREATE POLICY "Admins can view all quiz templates" 
  ON public.quiz_templates 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND id IN (
        SELECT auth.uid() 
        FROM auth.users 
        WHERE email IN ('davicastrowp@gmail.com', 'admin@iacopychief.com')
      )
    )
  );

-- Política para admins poderem criar templates
CREATE POLICY "Admins can create quiz templates" 
  ON public.quiz_templates 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND id IN (
        SELECT auth.uid() 
        FROM auth.users 
        WHERE email IN ('davicastrowp@gmail.com', 'admin@iacopychief.com')
      )
    )
  );

-- Política para admins poderem atualizar templates
CREATE POLICY "Admins can update quiz templates" 
  ON public.quiz_templates 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND id IN (
        SELECT auth.uid() 
        FROM auth.users 
        WHERE email IN ('davicastrowp@gmail.com', 'admin@iacopychief.com')
      )
    )
  );

-- Política para usuários poderem ler templates ativos (para usar nos quiz)
CREATE POLICY "Users can view active quiz templates" 
  ON public.quiz_templates 
  FOR SELECT 
  USING (is_active = true);

-- Criar índices para performance
CREATE INDEX idx_quiz_templates_type_active ON public.quiz_templates(quiz_type, is_active);
CREATE INDEX idx_quiz_templates_default ON public.quiz_templates(is_default, is_active);

-- Inserir templates padrão baseados nos dados atuais
INSERT INTO public.quiz_templates (quiz_type, title, description, questions, is_default, is_active) VALUES 
('vsl', 'Quiz para Vídeo de Vendas (VSL)', 'Gere roteiros persuasivos para seus vídeos de vendas', '[
  {
    "id": "product",
    "question": "Qual é o seu produto/serviço?",
    "type": "textarea",
    "required": true,
    "placeholder": "Ex: Curso de copywriting para iniciantes, Consultoria de marketing digital, etc."
  },
  {
    "id": "avatar",
    "question": "Quem é seu avatar ideal?",
    "type": "textarea",
    "required": true,
    "placeholder": "Ex: Empreendedores entre 25-45 anos, renda de R$5-15k, que querem escalar seus negócios..."
  },
  {
    "id": "pain",
    "question": "Qual a principal dor/problema que seu avatar enfrenta?",
    "type": "textarea",
    "required": true,
    "placeholder": "Ex: Dificuldade para criar textos que vendem, baixa conversão nos anúncios..."
  },
  {
    "id": "promise",
    "question": "Qual é a promessa/resultado principal que você oferece?",
    "type": "textarea",
    "required": true,
    "placeholder": "Ex: Aumentar as vendas em 300% em 90 dias, Criar copies que convertem..."
  },
  {
    "id": "duration",
    "question": "Quanto tempo seu avatar tem para assistir ao vídeo?",
    "type": "radio",
    "required": true,
    "options": ["30 segundos (Stories/TikTok)", "1-2 minutos (Reel/Post)", "3-5 minutos (VSL curto)", "10+ minutos (VSL longo)"]
  },
  {
    "id": "social_proof",
    "question": "Que tipo de prova social você tem?",
    "type": "radio",
    "required": true,
    "options": ["Depoimentos em vídeo", "Casos de sucesso com números", "Certificações/autoridade", "Quantidade de alunos/clientes"]
  },
  {
    "id": "price",
    "question": "Qual é o preço do seu produto?",
    "type": "radio",
    "required": true,
    "options": ["Até R$ 100", "R$ 100 - R$ 500", "R$ 500 - R$ 2.000", "R$ 2.000 - R$ 10.000", "Acima de R$ 10.000"]
  },
  {
    "id": "urgency",
    "question": "Há urgência/escassez real na oferta?",
    "type": "radio",
    "required": true,
    "options": ["Promoção por tempo limitado", "Vagas limitadas", "Bônus por tempo limitado", "Sem urgência real"]
  },
  {
    "id": "tone",
    "question": "Qual o tom ideal para o vídeo?",
    "type": "radio",
    "required": true,
    "options": ["Motivacional/Inspirador", "Educativo/Didático", "Provocativo/Desafiador", "Emocional/Storytelling"]
  },
  {
    "id": "platform",
    "question": "Onde o vídeo será usado?",
    "type": "radio",
    "required": true,
    "options": ["Instagram/TikTok (vertical)", "Facebook/YouTube (horizontal)", "Landing Page", "Anúncios pagos"]
  }
]'::jsonb, true, true),

('product', 'Quiz para Estrutura de Oferta', 'Monte ofertas irresistíveis com bônus e urgência', '[
  {
    "id": "main_product",
    "question": "Qual é o seu produto/serviço principal?",
    "type": "textarea",
    "required": true,
    "placeholder": "Descreva detalhadamente seu produto principal..."
  },
  {
    "id": "niche",
    "question": "Em que nicho/mercado você atua?",
    "type": "radio",
    "required": true,
    "options": ["Marketing Digital", "Fitness/Saúde", "Relacionamentos", "Finanças/Investimentos", "Desenvolvimento Pessoal", "Educação", "Beleza/Estética", "Outro"]
  },
  {
    "id": "main_price",
    "question": "Qual é o preço do produto principal?",
    "type": "radio",
    "required": true,
    "options": ["R$ 97 - R$ 297", "R$ 297 - R$ 997", "R$ 997 - R$ 2.997", "R$ 2.997 - R$ 9.997", "Acima de R$ 10.000"]
  },
  {
    "id": "modules",
    "question": "Quantos módulos/componentes tem seu produto?",
    "type": "radio",
    "required": true,
    "options": ["1-3 módulos", "4-6 módulos", "7-10 módulos", "Mais de 10 módulos", "Produto único (sem módulos)"]
  },
  {
    "id": "bonuses",
    "question": "Que bônus você pode incluir na oferta?",
    "type": "textarea",
    "required": true,
    "placeholder": "Ex: E-book exclusivo, Templates prontos, Grupo VIP, Consultoria individual..."
  },
  {
    "id": "delivery",
    "question": "Qual é o prazo de entrega/acesso?",
    "type": "radio",
    "required": true,
    "options": ["Acesso imediato", "24-48 horas", "1 semana", "Liberação por módulos", "Produto físico (envio)"]
  },
  {
    "id": "guarantee",
    "question": "Você oferece garantia?",
    "type": "radio",
    "required": true,
    "options": ["7 dias", "15 dias", "30 dias", "60 dias", "90 dias", "Sem garantia"]
  },
  {
    "id": "differentials",
    "question": "Como você se diferencia dos concorrentes?",
    "type": "textarea",
    "required": true,
    "placeholder": "Ex: Método exclusivo, Mais prático, Resultados mais rápidos, Suporte personalizado..."
  },
  {
    "id": "roi",
    "question": "Qual ROI/retorno o cliente pode esperar?",
    "type": "textarea",
    "required": true,
    "placeholder": "Ex: Aumentar vendas em 200%, Economizar 10h por semana, Ganhar R$5k/mês extra..."
  },
  {
    "id": "support",
    "question": "Que tipo de suporte você oferece?",
    "type": "radio",
    "required": true,
    "options": ["Grupo exclusivo no Telegram/WhatsApp", "Suporte por email", "Calls ao vivo", "Mentoria 1:1", "Sem suporte adicional"]
  }
]'::jsonb, true, true),

('landing', 'Quiz para Landing Page', 'Páginas que convertem visitantes em clientes', '[
  {
    "id": "objective",
    "question": "Qual é o objetivo da landing page?",
    "type": "radio",
    "required": true,
    "options": ["Capturar leads (email)", "Venda direta", "Inscrição em webinar/evento", "Download de material", "Agendamento de consultoria"]
  },
  {
    "id": "traffic_source",
    "question": "De onde vem o tráfego principal?",
    "type": "radio",
    "required": true,
    "options": ["Google Ads", "Facebook/Instagram Ads", "Tráfego orgânico (SEO)", "Email marketing", "Indicações diretas"]
  },
  {
    "id": "capture_info",
    "question": "Qual informação você quer capturar?",
    "type": "radio",
    "required": true,
    "options": ["Apenas email", "Nome + email", "Nome + email + telefone", "Dados completos + empresa", "Formulário qualificado (múltiplas perguntas)"]
  },
  {
    "id": "lead_magnet",
    "question": "Qual é a oferta/isca digital?",
    "type": "textarea",
    "required": true,
    "placeholder": "Ex: E-book \"7 Estratégias de Vendas\", Planilha de controle financeiro, Mini-curso gratuito..."
  },
  {
    "id": "form_fields",
    "question": "Quantos campos no formulário?",
    "type": "radio",
    "required": true,
    "options": ["1 campo (só email)", "2 campos (nome + email)", "3 campos (nome + email + telefone)", "4+ campos (dados completos)"]
  },
  {
    "id": "urgency_landing",
    "question": "Há deadline/urgência real na oferta?",
    "type": "radio",
    "required": true,
    "options": ["Sim, promoção por tempo limitado", "Sim, vagas limitadas", "Sim, bônus por tempo limitado", "Não há urgência real"]
  },
  {
    "id": "objections",
    "question": "Que objeções seu público costuma ter?",
    "type": "textarea",
    "required": true,
    "placeholder": "Ex: \"Não tenho tempo\", \"É muito caro\", \"Já tentei outros métodos\", \"Não sei se funciona\"..."
  },
  {
    "id": "testimonials",
    "question": "Você tem depoimentos/cases para incluir?",
    "type": "radio",
    "required": true,
    "options": ["Sim, vários depoimentos em vídeo", "Sim, depoimentos escritos", "Sim, cases de sucesso com resultados", "Poucos depoimentos", "Ainda não tenho"]
  },
  {
    "id": "next_step",
    "question": "Qual é o próximo passo após a conversão?",
    "type": "radio",
    "required": true,
    "options": ["Envio de email com material", "Redirecionamento para página de obrigado", "Ligação da equipe comercial", "Acesso direto ao produto", "Inscrição confirmada em evento"]
  },
  {
    "id": "device_priority",
    "question": "A landing page é otimizada para:",
    "type": "radio",
    "required": true,
    "options": ["Mobile-first (maioria mobile)", "Desktop-first (maioria desktop)", "Equilibrado (50/50)", "Focado em tablet"]
  }
]'::jsonb, true, true),

('ads', 'Quiz para Anúncios Pagos', 'Anúncios que geram cliques e conversões', '[
  {
    "id": "platform",
    "question": "Em qual plataforma vai veicular?",
    "type": "radio",
    "required": true,
    "options": ["Facebook/Instagram", "Google Ads (pesquisa)", "Google Ads (display)", "LinkedIn", "TikTok", "YouTube"]
  },
  {
    "id": "campaign_objective",
    "question": "Qual é o objetivo da campanha?",
    "type": "radio",
    "required": true,
    "options": ["Tráfego para landing page", "Conversões diretas", "Reconhecimento de marca", "Engajamento/interação", "Geração de leads"]
  },
  {
    "id": "budget",
    "question": "Qual seu orçamento diário?",
    "type": "radio",
    "required": true,
    "options": ["R$ 20 - R$ 50/dia", "R$ 50 - R$ 100/dia", "R$ 100 - R$ 300/dia", "R$ 300 - R$ 1.000/dia", "Acima de R$ 1.000/dia"]
  },
  {
    "id": "ad_format",
    "question": "Qual formato de anúncio?",
    "type": "radio",
    "required": true,
    "options": ["Imagem única", "Vídeo curto (até 30s)", "Vídeo longo (1min+)", "Carrossel de imagens", "Stories/Reels"]
  },
  {
    "id": "audience_temperature",
    "question": "Sua audiência é:",
    "type": "radio",
    "required": true,
    "options": ["Fria (não conhece você)", "Morna (já teve contato)", "Quente (já conhece/segue)", "Remarketing (visitou site/LP)", "Lookalike (similar aos clientes)"]
  },
  {
    "id": "targeting",
    "question": "Há segmentação específica?",
    "type": "textarea",
    "required": true,
    "placeholder": "Ex: Empreendedores 25-45 anos, São Paulo, interessados em marketing digital..."
  },
  {
    "id": "desired_action",
    "question": "Qual é a ação desejada?",
    "type": "radio",
    "required": true,
    "options": ["Clique no link", "Cadastro com email", "Compra direta", "Agendamento de call", "Download de material", "Inscrição em evento"]
  },
  {
    "id": "seasonality",
    "question": "Há sazonalidade no seu negócio?",
    "type": "radio",
    "required": true,
    "options": ["Sim, Black Friday/datas especiais", "Sim, início/final do ano", "Sim, períodos específicos do mês", "Não há sazonalidade", "Não sei ainda"]
  },
  {
    "id": "remarketing",
    "question": "Você faz remarketing?",
    "type": "radio",
    "required": true,
    "options": ["Sim, pixel configurado + listas", "Sim, só pixel básico", "Tenho lista de clientes", "Não faço remarketing", "Não sei como fazer"]
  },
  {
    "id": "performance_history",
    "question": "Como está sua performance atual?",
    "type": "radio",
    "required": true,
    "options": ["CTR alto (acima de 2%)", "CTR médio (1-2%)", "CTR baixo (abaixo de 1%)", "CPC muito alto", "Primeira campanha"]
  }
]'::jsonb, true, true);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_quiz_templates_updated_at
  BEFORE UPDATE ON public.quiz_templates
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_updated_at_column();
