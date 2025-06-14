
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Wrench,
  History,
  HelpCircle,
  Package,
  LogOut,
  Bot,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

const menuItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Agentes IA',
    url: '/agents',
    icon: Users,
  },
  {
    title: 'Produtos',
    url: '/products',
    icon: Package,
  },
  {
    title: 'Ferramentas',
    url: '/tools',
    icon: Wrench,
  },
  {
    title: 'Histórico',
    url: '/history',
    icon: History,
  },
  {
    title: 'Quiz',
    url: '/quiz',
    icon: HelpCircle,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { signOut, user } = useAuth();

  return (
    <Sidebar className="!bg-zinc-950 md:!bg-[#1A1A1A]/95 border-r border-[#2A2A2A] backdrop-blur-xl z-50 transition-colors duration-300" collapsible="icon">
      <SidebarHeader className="p-3 sm:p-4 border-b border-[#2A2A2A]">
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

      <SidebarContent>
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
      
      <SidebarFooter className="p-3 sm:p-4 border-t border-[#2A2A2A]">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 group-data-[collapsible=icon]:justify-center">
          <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-[#3B82F6] text-white text-xs sm:text-sm">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-xs sm:text-sm font-medium text-white truncate">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário'}
            </p>
            <p className="text-xs text-[#CCCCCC] truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={signOut}
          size="sm"
          className="w-full justify-start text-[#CCCCCC] hover:text-white hover:bg-[#2A2A2A] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
        >
          <LogOut className="w-4 h-4 flex-shrink-0 group-data-[collapsible=icon]:mr-0 mr-2" />
          <span className="group-data-[collapsible=icon]:hidden">Sair</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
