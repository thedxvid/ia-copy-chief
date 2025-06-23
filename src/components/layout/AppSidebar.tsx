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
  User,
  Settings,
  Shield,
  Coins,
  Plus
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
  useSidebar,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ProfileSettings } from '@/components/profile/ProfileSettings';
import { TokenPurchaseModal } from '@/components/tokens/TokenPurchaseModal';

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
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [showTokenPurchase, setShowTokenPurchase] = useState(false)
  const currentPath = location.pathname

  // Lista de emails de administradores definitivos
  const adminEmails = ['davicastrowp@gmail.com', 'admin@iacopychief.com'];
  
  // Verificar se é admin
  const isAdmin = user?.email && adminEmails.includes(user.email);

  const isCollapsed = state === "collapsed"
  const isActive = (path: string) => currentPath === path

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

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <Sidebar
        className={`${isCollapsed ? "w-14" : "w-60"} bg-[#1A1A1A] border-r border-[#333333]`}
        collapsible="icon"
      >
        <SidebarHeader className={`border-b border-[#333333] ${isCollapsed ? "px-2 py-4" : "p-4"}`}>
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "space-x-2"}`}>
            <div className="w-8 h-8 bg-[#3B82F6] rounded-xl flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <span className="text-xl font-bold text-white">CopyChief</span>
            )}
          </div>
        </SidebarHeader>

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

          {/* Nova seção de Tokens */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-[#CCCCCC] text-xs uppercase tracking-wider">
              Tokens
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => setShowTokenPurchase(true)}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-green-400 hover:bg-green-600/20 hover:text-green-300"
                  >
                    <div className="flex items-center space-x-2">
                      <Coins className="h-4 w-4" />
                      <Plus className="h-3 w-3" />
                    </div>
                    {!isCollapsed && <span>Comprar Tokens</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {isAdmin && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-[#CCCCCC] text-xs uppercase tracking-wider">
                Administrativo
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to="/admin" 
                        end 
                        className={({ isActive }) => `${getNavCls({ isActive })} flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors`}
                      >
                        <Shield className="h-4 w-4" />
                        {!isCollapsed && <span>Admin</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="border-t border-[#333333] p-2 mb-4">
          <SidebarMenu>
            {user && !isCollapsed && (
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton className="w-full flex items-center space-x-3 px-3 py-2 text-[#CCCCCC] hover:bg-[#2A2A2A] hover:text-white rounded-lg transition-colors">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="bg-[#3B82F6] text-white text-xs">
                          {getInitials(user.user_metadata?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start min-w-0">
                        <span className="text-sm font-medium truncate">
                          {user.user_metadata?.full_name || 'Usuário'}
                        </span>
                        <span className="text-xs text-[#666666] truncate">
                          {user.email}
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-[#1E1E1E] border-[#4B5563]">
                    {isAdmin && (
                      <>
                        <DropdownMenuItem asChild>
                          <NavLink to="/admin" className="flex items-center text-white hover:bg-[#2A2A2A]">
                            <Shield className="mr-2 h-4 w-4" />
                            Admin
                          </NavLink>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[#4B5563]" />
                      </>
                    )}
                    
                    <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                      <SheetTrigger asChild>
                        <DropdownMenuItem 
                          className="text-white hover:bg-[#2A2A2A] cursor-pointer"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Configurações
                        </DropdownMenuItem>
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
                    <DropdownMenuSeparator className="bg-[#4B5563]" />
                    <DropdownMenuItem onClick={handleSignOut} className="text-white hover:bg-[#2A2A2A]">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            )}
            
            {user && isCollapsed && (
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton className="w-full flex items-center justify-center p-2 text-[#CCCCCC] hover:bg-[#2A2A2A] hover:text-white rounded-lg transition-colors">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="bg-[#3B82F6] text-white text-xs">
                          {getInitials(user.user_metadata?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-[#1E1E1E] border-[#4B5563]">
                    {isAdmin && (
                      <>
                        <DropdownMenuItem asChild>
                          <NavLink to="/admin" className="flex items-center text-white hover:bg-[#2A2A2A]">
                            <Shield className="mr-2 h-4 w-4" />
                            Admin
                          </NavLink>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[#4B5563]" />
                      </>
                    )}
                    
                    <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                      <SheetTrigger asChild>
                        <DropdownMenuItem 
                          className="text-white hover:bg-[#2A2A2A] cursor-pointer"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Configurações
                        </DropdownMenuItem>
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
                    <DropdownMenuSeparator className="bg-[#4B5563]" />
                    <DropdownMenuItem onClick={handleSignOut} className="text-white hover:bg-[#2A2A2A]">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Modal de Compra de Tokens */}
      <TokenPurchaseModal 
        isOpen={showTokenPurchase} 
        onClose={() => setShowTokenPurchase(false)} 
      />
    </>
  )
}
