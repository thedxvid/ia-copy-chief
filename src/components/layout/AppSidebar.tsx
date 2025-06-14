import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import {
  Home,
  Package,
  LayoutDashboard,
  Settings,
  Clock,
  Zap,
  Bot,
  BarChart3
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Produtos', href: '/products', icon: Package },
  { name: 'Ferramentas', href: '/tools', icon: Zap },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Histórico', href: '/history', icon: Clock },
  { name: 'Agentes', href: '/agents', icon: Bot },
];

export const AppSidebar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
      toast({
        title: "Logout realizado com sucesso!",
        description: "Você será redirecionado para a página de login.",
      })
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast({
        variant: "destructive",
        title: "Erro ao fazer logout!",
        description: "Por favor, tente novamente.",
      })
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="p-2">
          <LayoutDashboard className="h-6 w-6" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 bg-[#161618] border-r border-zinc-700/50">
        <SheetHeader className="text-left">
          <SheetTitle className="text-lg font-semibold">Menu</SheetTitle>
          <SheetDescription>
            Navegue pelas funcionalidades do sistema.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col space-y-4 py-4">
          <div className="px-3 py-2">
            <div className="space-y-1 text-sm">
              {user?.email ? (
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={`https://avatar.vercel.sh/${user.email}.png`} />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium text-white">{user.email}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              )}
            </div>
          </div>
          <Separator className="bg-zinc-700/50" />
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-700/10 focus:outline-none
                ${isActive ? 'text-sky-500' : 'text-gray-400 hover:text-gray-50'}`
              }
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </NavLink>
          ))}
          <Separator className="bg-zinc-700/50" />
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-700/10 focus:outline-none
              ${isActive ? 'text-sky-500' : 'text-gray-400 hover:text-gray-50'}`
            }
          >
            <Settings className="h-4 w-4" />
            <span>Configurações</span>
          </NavLink>
        </div>
        <SheetFooter>
          <Button variant="outline" className="w-full mt-4 border-zinc-700/50 text-white hover:bg-zinc-700/10" onClick={handleSignOut}>
            Sair
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={`flex flex-col justify-center items-center p-4 ${className}`} {...props}>
    </div>
  );
};
