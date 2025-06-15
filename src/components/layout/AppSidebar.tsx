import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Brain,
  Megaphone,
  Video,
  FileText,
  PenTool,
  Wrench,
  History,
  Bot,
  Settings,
  HelpCircle,
  Users,
  User,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { ProfileSettings } from '@/components/profile/ProfileSettings';

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Produtos",
    url: "/products",
    icon: Package,
  },
  {
    title: "Quiz IA",
    url: "/quiz", 
    icon: Brain,
  },
  {
    title: "Anúncios",
    url: "/ads",
    icon: Megaphone,
  },
  {
    title: "Vídeos de Venda",
    url: "/sales-videos",
    icon: Video,
  },
  {
    title: "Páginas",
    url: "/pages",
    icon: FileText,
  },
  {
    title: "Conteúdos",
    url: "/content",
    icon: PenTool,
  },
  {
    title: "Ferramentas",
    url: "/tools",
    icon: Wrench,
  },
  {
    title: "Histórico",
    url: "/history",
    icon: History,
  },
  {
    title: "Agentes IA",
    url: "/agents",
    icon: Bot,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <Sidebar 
      className="!bg-zinc-950 md:!bg-[#1A1A1A]/95 border-r border-[#2A2A2A] backdrop-blur-xl z-50 transition-colors duration-300" 
      collapsible="icon"
      style={{ backgroundColor: '#0a0a0a' }}
    >
      <SidebarHeader className="p-3 sm:p-4 border-b border-[#2A2A2A] !bg-zinc-950" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="flex items-center gap-2 sm:gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#3B82F6] rounded-lg flex items-center justify-center flex-shrink-0">
            <Bot className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h1 className="text-base sm:text-lg font-bold text-white">CopyChief</h1>
            <p className="text-xs text-[#CCCCCC]">Marketing Digital</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="!bg-zinc-950" style={{ backgroundColor: '#0a0a0a' }}>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[#CCCCCC] text-xs uppercase tracking-wider px-2">
            <span className="group-data-[collapsible=icon]:hidden">Menu Principal</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    size="sm"
                    className={`text-white hover:bg-[#2A2A2A] hover:text-[#3B82F6] transition-colors ${
                      location.pathname === item.url ? 'bg-[#3B82F6]/20 text-[#3B82F6] border-r-2 border-[#3B82F6]' : ''
                    }`}
                  >
                    <Link to={item.url}>
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-3 sm:p-4 border-t border-[#2A2A2A] !bg-zinc-950" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 group-data-[collapsible=icon]:justify-center">
          <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
            <SheetTrigger asChild>
              <button className="flex items-center gap-2 sm:gap-3 hover:bg-[#2A2A2A] rounded-xl p-1 transition-colors group-data-[collapsible=icon]:justify-center w-full">
                <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-[#3B82F6] text-white text-xs sm:text-sm">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden text-left">
                  <p className="text-xs sm:text-sm font-medium text-white truncate">
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário'}
                  </p>
                  <p className="text-xs text-[#CCCCCC] truncate">
                    {user?.email}
                  </p>
                </div>
              </button>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="w-full sm:max-w-2xl overflow-y-auto"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Configurações do Perfil</SheetTitle>
              </SheetHeader>
              <ProfileSettings onClose={() => setIsProfileOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
        
        <div className="space-y-1 group-data-[collapsible=icon]:space-y-2">
          <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-[#CCCCCC] hover:text-white hover:bg-[#2A2A2A] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:p-0"
              >
                <Settings className="w-4 h-4 flex-shrink-0 group-data-[collapsible=icon]:mr-0 mr-2" />
                <span className="group-data-[collapsible=icon]:hidden">Configurações</span>
              </Button>
            </SheetTrigger>
          </Sheet>
          
          <Button
            variant="ghost"
            onClick={signOut}
            size="sm"
            className="w-full justify-start text-[#CCCCCC] hover:text-white hover:bg-[#2A2A2A] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:p-0"
          >
            <LogOut className="w-4 h-4 flex-shrink-0 group-data-[collapsible=icon]:mr-0 mr-2" />
            <span className="group-data-[collapsible=icon]:hidden">Sair</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
