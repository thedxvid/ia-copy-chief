
import { Bot, BarChart3, Users, MessageSquare, Zap, Rocket } from 'lucide-react';

export interface TutorialStep {
  id: number;
  title: string;
  description: string;
  content: string;
  targetElement?: string;
  position: 'center' | 'top' | 'bottom' | 'left' | 'right';
  icon: any;
  highlightElement?: string;
}

export const tutorialSteps: TutorialStep[] = [
  {
    id: 0,
    title: "Bem-vindo ao CopyChief! 🎉",
    description: "Vamos fazer um tour rápido pela plataforma",
    content: "O CopyChief é sua plataforma completa de IA para criação de copy persuasivo. Em poucos minutos você vai dominar todas as funcionalidades e estar criando copies de alta conversão!",
    position: 'center',
    icon: Bot,
  },
  {
    id: 1,
    title: "Navegação Principal",
    description: "Conheça as principais seções",
    content: "Use a barra lateral para navegar entre as diferentes seções: Dashboard para métricas, Agentes IA para copy personalizado, Produtos para gerenciar seus projetos e muito mais.",
    targetElement: '[data-tutorial="sidebar"]',
    highlightElement: '[data-tutorial="sidebar"]',
    position: 'right',
    icon: BarChart3,
  },
  {
    id: 2,
    title: "Seu Dashboard",
    description: "Acompanhe sua performance",
    content: "Aqui você visualiza métricas importantes, projetos recentes, insights de IA e pode acessar ações rápidas. É o centro de controle da sua estratégia de copywriting.",
    targetElement: '[data-tutorial="dashboard-content"]',
    highlightElement: '[data-tutorial="dashboard-content"]',
    position: 'center',
    icon: BarChart3,
  },
  {
    id: 3,
    title: "Sistema de Tokens",
    description: "Gerencie seu uso de IA",
    content: "Cada geração de copy consome tokens. Acompanhe seu saldo aqui e saiba quando precisa renovar. Usuários novos começam com tokens gratuitos!",
    targetElement: '[data-tutorial="token-widget"]',
    highlightElement: '[data-tutorial="token-widget"]',
    position: 'bottom',
    icon: Zap,
  },
  {
    id: 4,
    title: "Chat com Agentes IA",
    description: "Converse com especialistas virtuais",
    content: "Clique neste botão para conversar com diferentes agentes especializados. Cada agente é treinado para um tipo específico de copy: vendas, e-mail marketing, redes sociais e muito mais!",
    targetElement: '[data-tutorial="floating-chat"]',
    highlightElement: '[data-tutorial="floating-chat"]',
    position: 'left',
    icon: MessageSquare,
  },
  {
    id: 5,
    title: "Pronto para Começar! 🚀",
    description: "Crie seu primeiro projeto",
    content: "Agora que você conhece a plataforma, que tal criar seu primeiro projeto? Use o Quiz para definir estratégias ou vá direto para os Agentes IA. O sucesso está a um clique de distância!",
    position: 'center',
    icon: Rocket,
  },
];
