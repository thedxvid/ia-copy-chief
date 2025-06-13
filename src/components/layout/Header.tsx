
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, Settings, History, Book, Brain } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import { cn } from '@/lib/utils';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const location = useLocation();
  const { state } = useApp();
  const { isScrolled } = useScrollPosition(50);

  const navigation = [
    { name: 'Início', href: '/', icon: Home },
    { name: 'Dashboard', href: '/dashboard', icon: Settings },
    { name: 'Ferramentas', href: '/tools', icon: Book },
    { name: 'Histórico', href: '/history', icon: History },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 transition-all duration-500 ease-out",
        "backdrop-blur-xl border-b border-white/10",
        isScrolled 
          ? "bg-gray-900/90 shadow-lg mx-4 mt-4 rounded-2xl border-white/20" 
          : "bg-gray-900/60 mx-0 mt-0 rounded-none border-white/10"
      )}
    >
      <div className={cn(
        "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-500",
        isScrolled ? "py-3" : "py-4"
      )}>
        <div className="flex justify-between items-center">
          {/* Logo with AI Icon */}
          <Link 
            to="/" 
            className="flex items-center space-x-3 group animate-fade-in-left"
          >
            <div className={cn(
              "bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110",
              isScrolled ? "w-10 h-10" : "w-12 h-12"
            )}>
              <Brain className={cn(
                "text-white transition-all duration-300",
                isScrolled ? "w-5 h-5" : "w-6 h-6"
              )} />
            </div>
            <span className={cn(
              "font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent transition-all duration-300",
              isScrolled ? "text-xl" : "text-2xl"
            )}>
              CopyChief
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-2 animate-fade-in-down">
            {navigation.map((item, index) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 group modern-button",
                  isActive(item.href)
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'text-gray-300 hover:text-white hover:bg-white/10',
                  `animate-stagger-${index + 1}`
                )}
              >
                <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Theme Toggle & Mobile Menu */}
          <div className="flex items-center space-x-2 animate-fade-in-right">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "md:hidden rounded-xl transition-all duration-300 hover:scale-110 text-white hover:bg-white/10",
                isScrolled ? "w-10 h-10" : "w-12 h-12"
              )}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 transition-transform duration-200 rotate-90" />
              ) : (
                <Menu className="w-5 h-5 transition-transform duration-200" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 animate-fade-in-up">
            <div className="glass rounded-2xl p-4 space-y-2 bg-gray-800/80 border-white/10">
              {navigation.map((item, index) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 modern-button",
                    isActive(item.href)
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-white/10',
                    `animate-stagger-${index + 1}`
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
