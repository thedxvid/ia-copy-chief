
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
    <Sidebar className="bg-[#1A1A1A] border-r border-[#2A2A2A]">
      <SidebarHeader className="p-4 border-b border-[#2A2A2A]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#3B82F6] rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">CopyChief</h1>
            <p className="text-xs text-[#888888]">Marketing Digital</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[#888888] text-xs uppercase tracking-wider">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    className={`text-white hover:bg-[#2A2A2A] hover:text-[#3B82F6] transition-colors ${
                      location.pathname === item.url ? 'bg-[#3B82F6]/20 text-[#3B82F6] border-r-2 border-[#3B82F6]' : ''
                    }`}
                  >
                    <Link to={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t border-[#2A2A2A]">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-[#3B82F6] text-white text-sm">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário'}
            </p>
            <p className="text-xs text-[#888888] truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start text-[#888888] hover:text-white hover:bg-[#2A2A2A]"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
