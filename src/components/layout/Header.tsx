
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, Settings, History, Book } from 'lucide-react';
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
        "backdrop-blur-xl border-b border-border/50",
        isScrolled 
          ? "bg-background/80 shadow-lg mx-4 mt-4 rounded-2xl border-border/30" 
          : "bg-background/60 mx-0 mt-0 rounded-none border-border/20"
      )}
    >
      <div className={cn(
        "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-500",
        isScrolled ? "py-3" : "py-4"
      )}>
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-3 group animate-fade-in-left"
          >
            <div className={cn(
              "bg-gradient-to-r from-brand-600 to-purple-600 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110",
              isScrolled ? "w-10 h-10" : "w-12 h-12"
            )}>
              <span className={cn(
                "text-white font-bold transition-all duration-300",
                isScrolled ? "text-sm" : "text-base"
              )}>
                CG
              </span>
            </div>
            <span className={cn(
              "font-bold text-gradient transition-all duration-300",
              isScrolled ? "text-xl" : "text-2xl"
            )}>
              CopyGenius
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
                    ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
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
                "md:hidden rounded-xl transition-all duration-300 hover:scale-110",
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
            <div className="glass rounded-2xl p-4 space-y-2">
              {navigation.map((item, index) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 modern-button",
                    isActive(item.href)
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
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
