
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import { ModernButton } from '@/components/ui/modern-button';
import { ThemeToggle } from './ThemeToggle';
import { Menu, X, User, LogOut, Bot } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { isScrolled } = useScrollPosition(10);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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
      <div className={cn(
        "mx-auto transition-all duration-300 ease-in-out pointer-events-auto",
        isScrolled
          ? "mt-4 max-w-6xl w-[90%] rounded-full bg-neutral-900/80 backdrop-blur-md shadow-lg border border-white/10"
          : "w-full rounded-none bg-[#121212]/90 backdrop-blur-md border-b border-[#4B5563]/50"
      )}>
        <div className={cn(
          "transition-all duration-300 ease-in-out",
          isScrolled ? "px-6" : "px-3 sm:px-4"
        )}>
          <div className={cn(
            "flex items-center justify-between h-14 sm:h-16 transition-all duration-300 ease-in-out",
            isScrolled && "gap-2"
          )}>
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-7 sm:w-8 h-7 sm:h-8 bg-[#3B82F6] rounded-xl flex items-center justify-center">
                <Bot className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-white">CopyChief</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className={cn(
              "hidden md:flex items-center transition-all duration-300 ease-in-out",
              isScrolled ? "space-x-4" : "space-x-6 lg:space-x-8"
            )}>
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
            <div className={cn(
              "flex items-center transition-all duration-300 ease-in-out",
              isScrolled ? "space-x-2" : "space-x-2 sm:space-x-4"
            )}>
              <ThemeToggle />
              
              {loading ? (
                <div className="w-6 sm:w-8 h-6 sm:h-8 animate-spin rounded-full border-b-2 border-[#3B82F6]"></div>
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center space-x-2 hover:bg-[#1E1E1E] rounded-xl p-1 sm:p-2 transition-colors">
                      <Avatar className="w-7 sm:w-8 h-7 sm:h-8">
                        <AvatarFallback className="bg-[#3B82F6] text-white text-xs sm:text-sm">
                          {getInitials(user.user_metadata?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className={cn(
                        "text-white text-sm transition-all duration-300 ease-in-out",
                        isScrolled ? "hidden xl:block" : "hidden lg:block"
                      )}>
                        {user.user_metadata?.full_name || user.email}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-[#1E1E1E] border-[#4B5563] z-50">
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
              ) : (
                <div className={cn(
                  "hidden md:flex items-center transition-all duration-300 ease-in-out",
                  isScrolled ? "space-x-2" : "space-x-2 lg:space-x-3"
                )}>
                  <Link
                    to="/auth"
                    className="text-[#CCCCCC] hover:text-white transition-colors duration-200 px-3 lg:px-4 py-2 text-sm lg:text-base"
                  >
                    Entrar
                  </Link>
                  <ModernButton asChild size="sm" className="text-sm">
                    <Link to="/auth">Começar Agora</Link>
                  </ModernButton>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden text-white p-1.5 sm:p-2 hover:bg-[#1E1E1E] rounded-xl transition-colors"
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-[#4B5563]/50">
              <div className="py-4 px-2">
                <nav className="flex flex-col space-y-3">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="text-[#CCCCCC] hover:text-white transition-colors duration-200 px-3 py-2 text-sm rounded-lg hover:bg-[#1E1E1E]"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                  
                  {!user && (
                    <div className="flex flex-col space-y-3 pt-4 border-t border-[#4B5563]/50">
                      <Link
                        to="/auth"
                        className="text-[#CCCCCC] hover:text-white transition-colors duration-200 px-3 py-2 text-sm rounded-lg hover:bg-[#1E1E1E]"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Entrar
                      </Link>
                      <div className="px-3">
                        <ModernButton asChild size="sm" className="w-full">
                          <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                            Começar Agora
                          </Link>
                        </ModernButton>
                      </div>
                    </div>
                  )}
                </nav>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
