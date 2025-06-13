
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileQuestion, 
  Bot, 
  Wrench, 
  History,
  LogOut
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const menuItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Quiz',
    url: '/quiz',
    icon: FileQuestion,
  },
  {
    title: 'Agentes',
    url: '/agents',
    icon: Bot,
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
];

export function AppSidebar() {
  const location = useLocation();
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar className="bg-[#1E1E1E] border-[#4B5563]/20">
      <SidebarHeader className="p-6 border-b border-[#4B5563]/20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#3B82F6] rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">CopyChief</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-[#1E1E1E]">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[#CCCCCC] text-xs uppercase tracking-wider px-3 py-2">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="text-[#CCCCCC] hover:bg-[#2A2A2A] hover:text-white">
                      <Link 
                        to={item.url}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive 
                            ? 'bg-[#3B82F6] text-white font-medium' 
                            : 'text-[#CCCCCC] hover:bg-[#2A2A2A] hover:text-white'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-6 border-t border-[#4B5563]/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#3B82F6] rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U'}
              </span>
            </div>
            <div className="text-sm">
              <p className="text-white font-medium">
                {user?.user_metadata?.full_name || 'Usuário'}
              </p>
              <p className="text-[#CCCCCC] text-xs">
                {user?.email}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-[#CCCCCC] hover:text-white hover:bg-[#2A2A2A]"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
