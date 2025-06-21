
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
  History,
  Package,
  Play,
  Megaphone,
  FileIcon,
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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
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

export function AppSidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Products",
      href: "/products",
      icon: Package,
    },
    {
      title: "History",
      href: "/history",
      icon: History,
    },
    {
      title: "Chat",
      href: "/chat",
      icon: MessageSquare,
    },
    {
      title: "Agents",
      href: "/agents",
      icon: Users,
    },
    {
      title: "Quiz",
      href: "/quiz",
      icon: HelpCircle,
    },
    {
      title: "Sales Videos",
      href: "/sales-videos",
      icon: Play,
    },
    {
      title: "Ads",
      href: "/ads",
      icon: Megaphone,
    },
    {
      title: "Pages",
      href: "/pages",
      icon: FileIcon,
    },
    {
      title: "Content",
      href: "/content",
      icon: FileText,
    },
  ];

  return (
    <Sidebar>
      <SidebarContent>
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
  );
}
