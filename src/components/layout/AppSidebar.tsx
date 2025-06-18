
import { useState } from "react"
import { 
  LayoutDashboard, 
  Package, 
  History, 
  MessageSquare, 
  Bot,
  HelpCircle, 
  Video, 
  Megaphone, 
  FileText, 
  PenTool,
  LogOut,
  User
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
  SidebarFooter,
} from "@/components/ui/sidebar"

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Produtos", url: "/products", icon: Package },
  { title: "Chat IA", url: "/chat", icon: MessageSquare },
  { title: "Agentes", url: "/agents", icon: Bot },
  { title: "Histórico", url: "/history", icon: History },
]

const toolItems = [
  { title: "Quiz IA", url: "/quiz", icon: HelpCircle },
  { title: "Vídeos de Vendas", url: "/sales-videos", icon: Video },
  { title: "Anúncios", url: "/ads", icon: Megaphone },
  { title: "Landing Pages", url: "/pages", icon: FileText },
  { title: "Conteúdo", url: "/content", icon: PenTool },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const { signOut, user } = useAuth()
  const currentPath = location.pathname

  const isCollapsed = state === "collapsed"
  const isActive = (path: string) => currentPath === path
  const isMainExpanded = mainItems.some((i) => isActive(i.url))
  const isToolsExpanded = toolItems.some((i) => isActive(i.url))

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-[#3B82F6] text-white font-medium hover:bg-[#2563EB]" 
      : "text-[#CCCCCC] hover:bg-[#2A2A2A] hover:text-white"

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  return (
    <Sidebar
      className={`${isCollapsed ? "w-14" : "w-60"} bg-[#1A1A1A] border-r border-[#333333]`}
      collapsible="icon"
    >
      <SidebarTrigger className="m-2 self-end text-white hover:bg-[#2A2A2A]" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[#CCCCCC] text-xs uppercase tracking-wider">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => `${getNavCls({ isActive })} flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors`}
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[#CCCCCC] text-xs uppercase tracking-wider">
            Ferramentas
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => `${getNavCls({ isActive })} flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors`}
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-[#333333] p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-3 px-3 py-2 text-[#CCCCCC] hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                {!isCollapsed && <span>Sair</span>}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {!isCollapsed && user && (
            <div className="px-3 py-2 text-xs text-[#666666] border-t border-[#333333] mt-2">
              <div className="flex items-center space-x-2">
                <User className="h-3 w-3" />
                <span className="truncate">{user.email}</span>
              </div>
            </div>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
