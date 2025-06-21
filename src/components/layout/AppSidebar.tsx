
import {
  Home,
  LayoutDashboard,
  Settings,
  HelpCircle,
  CreditCard,
  Coins,
  Users,
  Building2,
  Contact2,
  Book,
  LucideIcon,
  Mail,
  Bell,
  Plus,
  ChevronDown,
  ChevronsUpDown,
  CopyCheck,
  MessageSquare,
  BarChart3,
  KanbanSquare,
  ListChecks,
  FileSliders,
  ScrollText,
  LineChart,
  Sparkles,
  BrainCircuit,
  ClipboardList,
  FileText,
  BadgeCheck,
  CalendarClock,
  UserCog2,
  LogOut,
  User2,
  Key,
  ShieldCheck,
  PanelLeft,
} from "lucide-react"
import * as React from "react"
import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { useAuth } from "@/contexts/AuthContext"
import { useSidebar } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { TokenPurchaseModal } from "../tokens/TokenPurchaseModal"
import { supabase } from "@/integrations/supabase/client"

interface NavItem {
  title: string
  href?: string
  disabled?: boolean
  external?: boolean
  icon?: LucideIcon
  label?: string
  description?: string
}

interface NavGroup {
  title: string
  items: NavItem[]
}

export function AppSidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useSidebar();
  const [showTokenPurchase, setShowTokenPurchase] = useState(false);

  const navigationItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Chat IA",
      href: "/chat",
      icon: MessageSquare,
    },
    {
      title: "Gerador de Copys",
      href: "/copy-generator",
      icon: FileText,
    },
    {
      title: "Análise de SEO",
      href: "/seo-analysis",
      icon: BarChart3,
    },
    {
      title: "Planejador de Conteúdo",
      href: "/content-planner",
      icon: ClipboardList,
    },
    {
      title: "Calendário de Conteúdo",
      href: "/content-calendar",
      icon: CalendarClock,
    },
  ];

  const accountItems: NavItem[] = [
    {
      title: "Perfil",
      href: "/profile",
      icon: User2,
    },
    {
      title: "Segurança",
      href: "/security",
      icon: ShieldCheck,
    },
    {
      title: "Plano",
      href: "/billing",
      icon: CreditCard,
    },
  ];

  const settingsItems: NavItem[] = [
    {
      title: "Configurações",
      href: "/settings",
      icon: Settings,
    },
    {
      title: "Suporte",
      href: "/support",
      icon: HelpCircle,
    },
  ];

  const handleTokenPurchase = () => {
    if (isMobile) {
      // No mobile, navegar para página dedicada
      navigate('/tokens/purchase');
    } else {
      // No desktop, abrir modal
      setShowTokenPurchase(true);
    }
  };

  return (
    <>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => {
                      navigate(item.href || "");
                    }}
                    isActive={location.pathname === item.href}
                  >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>

          {/* Seção de Tokens */}
          <SidebarGroup>
            <SidebarGroupLabel>Tokens</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleTokenPurchase}>
                    <Coins className="h-4 w-4" />
                    <span>Comprar Tokens</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Seção de Conta */}
          <SidebarGroup>
            <SidebarGroupLabel>Conta</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {accountItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => {
                        navigate(item.href || "");
                      }}
                      isActive={location.pathname === item.href}
                    >
                      {item.icon && <item.icon className="h-4 w-4" />}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Seção de Configurações */}
          <SidebarGroup>
            <SidebarGroupLabel>Configurações</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {settingsItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => {
                        navigate(item.href || "");
                      }}
                      isActive={location.pathname === item.href}
                    >
                      {item.icon && <item.icon className="h-4 w-4" />}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <Separator />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex h-8 w-full p-0 px-2">
                <Avatar className="mr-2 h-6 w-6">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-sm font-medium leading-none">
                    {user?.user_metadata?.full_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user?.email}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                Perfil
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                Plano
                <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                Configurações
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  supabase.auth.signOut();
                  navigate("/login");
                }}
              >
                Sair
                <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Modal de Compra de Tokens - apenas no desktop */}
      {!isMobile && (
        <TokenPurchaseModal 
          isOpen={showTokenPurchase} 
          onClose={() => setShowTokenPurchase(false)} 
        />
      )}
    </>
  );
}
