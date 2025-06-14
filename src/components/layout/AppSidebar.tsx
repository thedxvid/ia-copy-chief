
import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { TokenWidget } from '@/components/tokens/TokenWidget';
import { useTokenContext } from '@/contexts/TokenContext';
import { Bot, Home, Package, History, Wrench, Users, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';

const menuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Home },
  { title: 'Produtos', url: '/products', icon: Package },
  { title: 'Agentes IA', url: '/agents', icon: Bot },
  { title: 'Ferramentas', url: '/tools', icon: Wrench },
  { title: 'Histórico', url: '/history', icon: History },
];

export const AppSidebar = () => {
  const { signOut, user } = useAuth();
  const { openTokenStore } = useTokenContext();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar className="border-r border-[#4B5563]/20 bg-[#1E1E1E]">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#3B82F6] rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">CopyChief</h1>
            <p className="text-xs text-[#CCCCCC]">AI Copy Generator</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[#CCCCCC] text-xs uppercase tracking-wider mb-2">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    className="text-[#CCCCCC] hover:text-white hover:bg-[#2A2A2A] data-[active=true]:bg-[#3B82F6] data-[active=true]:text-white"
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-[#CCCCCC] text-xs uppercase tracking-wider mb-2">
            Tokens
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <TokenWidget onOpenTokenStore={openTokenStore} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-[#4B5563]/20">
        <div className="space-y-3">
          {user && (
            <div className="flex items-center gap-3 p-2 rounded-lg bg-[#2A2A2A]">
              <div className="w-8 h-8 bg-[#3B82F6] rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-white">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.user_metadata?.full_name || 'Usuário'}
                </p>
                <p className="text-xs text-[#CCCCCC] truncate">
                  {user.email}
                </p>
              </div>
            </div>
          )}
          
          <SidebarMenuButton
            onClick={handleSignOut}
            className="w-full text-[#CCCCCC] hover:text-white hover:bg-[#2A2A2A] justify-start"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sair
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
