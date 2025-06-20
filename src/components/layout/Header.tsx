
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ModernButton } from '@/components/ui/modern-button';
import { Menu, X, User, LogOut, Bot, Settings, Shield } from 'lucide-react';
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

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  // Lista de emails de administradores definitivos
  const adminEmails = ['davicastrowp@gmail.com', 'admin@iacopychief.com'];
  
  // Verificar se é admin
  const isAdmin = user?.email && adminEmails.includes(user.email);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleMobileNavigation = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Quiz', href: '/quiz' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Ferramentas', href: '/tools' },
    { label: 'Histórico', href: '/history' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="mx-auto mt-4 max-w-6xl w-[90%] rounded-full bg-neutral-900/80 backdrop-blur-md shadow-lg border border-white/10 pointer-events-auto">
        <div className="px-6">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-7 sm:w-8 h-7 sm:h-8 bg-[#3B82F6] rounded-xl flex items-center justify-center">
                <Bot className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-white">CopyChief</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="text-[#CCCCCC] hover:text-white transition-colors duration-200 text-sm lg:text-base"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {loading ? (
                <div className="w-6 sm:w-8 h-6 sm:h-8 animate-spin rounded-full border-b-2 border-[#3B82F6]"></div>
              ) : user ? (
                <div className="flex items-center space-x-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center space-x-2 hover:bg-[#1E1E1E] rounded-xl p-1 sm:p-2 transition-colors">
                        <Avatar className="w-7 sm:w-8 h-7 sm:h-8">
                          <AvatarFallback className="bg-[#3B82F6] text-white text-xs sm:text-sm">
                            {getInitials(user.user_metadata?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-white text-sm hidden xl:block">
                          {user.user_metadata?.full_name || user.email}
                        </span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-[#1E1E1E] border-[#4B5563] z-50">
                      {isAdmin && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link to="/admin" className="flex items-center text-white hover:bg-[#2A2A2A]">
                              <Shield className="mr-2 h-4 w-4" />
                              Admin
                            </Link>
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
                      
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard" className="flex items-center text-white hover:bg-[#2A2A2A]">
                          <User className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-[#4B5563]" />
                      <DropdownMenuItem onClick={handleSignOut} className="text-white hover:bg-[#2A2A2A]">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-2">
                  <Link
                    to="/auth"
                    className="text-[#CCCCCC] hover:text-white transition-colors duration-200 px-3 lg:px-4 py-2 text-sm lg:text-base"
                  >
                    Entrar
                  </Link>
                  <ModernButton asChild size="sm" className="text-sm">
                    <Link to="/auth?mode=signup">Começar Agora</Link>
                  </ModernButton>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden text-white p-1.5 sm:p-2 hover:bg-[#1E1E1E] rounded-xl transition-colors"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm mt-14 sm:mt-16 pointer-events-auto">
          <div className="bg-[#121212]/95 backdrop-blur-md border border-[#4B5563]/30 rounded-2xl mx-4 mt-2 shadow-xl pointer-events-auto">
            <div className="py-4 px-3">
              <nav className="flex flex-col space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => handleMobileNavigation(item.href)}
                    className="text-[#CCCCCC] hover:text-white transition-colors duration-200 px-3 py-2 text-sm rounded-lg hover:bg-[#2A2A2A]/50 text-left"
                  >
                    {item.label}
                  </button>
                ))}
                
                {!user && (
                  <div className="flex flex-col space-y-2 pt-3 border-t border-[#4B5563]/30">
                    <button
                      onClick={() => handleMobileNavigation('/auth')}
                      className="text-[#CCCCCC] hover:text-white transition-colors duration-200 px-3 py-2 text-sm rounded-lg hover:bg-[#2A2A2A]/50 text-left"
                    >
                      Entrar
                    </button>
                    <div className="px-3">
                      <button
                        onClick={() => handleMobileNavigation('/auth?mode=signup')}
                        className="w-full bg-[#3B82F6] text-white py-2 px-4 rounded-xl text-sm font-medium hover:bg-[#2563EB] transition-colors"
                      >
                        Começar Agora
                      </button>
                    </div>
                  </div>
                )}
              </nav>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
