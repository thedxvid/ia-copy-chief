import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const {
    user,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth'
      });
    }
    setIsMenuOpen(false);
  };
  return <header className="fixed top-0 left-0 right-0 z-50 bg-[#121212]/95 backdrop-blur-sm border-b border-[#4B5563]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] flex items-center justify-center rounded-xl">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">CopyChief</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-[#CCCCCC] hover:text-white transition-colors">
              Home
            </Link>
            <button onClick={() => scrollToSection('features')} className="text-[#CCCCCC] hover:text-white transition-colors">
              Funcionalidades
            </button>
            <button onClick={() => scrollToSection('pricing')} className="text-[#CCCCCC] hover:text-white transition-colors">
              Preços
            </button>
            <Link to="/about" className="text-[#CCCCCC] hover:text-white transition-colors">
              Sobre
            </Link>
            <Link to="/contact" className="text-[#CCCCCC] hover:text-white transition-colors">
              Contato
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? <div className="flex items-center space-x-4">
                <Link to="/dashboard">
                  <Button variant="ghost" className="text-white hover:bg-[#3B82F6]/20">
                    Dashboard
                  </Button>
                </Link>
                <Button onClick={handleSignOut} variant="outline" className="border-[#3B82F6] text-[#3B82F6] hover:bg-[#3B82F6] hover:text-white">
                  Sair
                </Button>
              </div> : <div className="flex items-center space-x-4">
                <Link to="/auth">
                  <Button variant="ghost" className="text-white hover:bg-[#3B82F6]/20">
                    Entrar
                  </Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button className="bg-[#3B82F6] hover:bg-[#2563EB] text-white">Começar Agora</Button>
                </Link>
              </div>}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-white">
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && <div className="md:hidden absolute top-16 left-0 right-0 bg-[#121212] border-b border-[#4B5563]/20">
            <nav className="px-4 py-4 space-y-4">
              <Link to="/" className="block text-[#CCCCCC] hover:text-white transition-colors" onClick={() => setIsMenuOpen(false)}>
                Home
              </Link>
              <button onClick={() => scrollToSection('features')} className="block w-full text-left text-[#CCCCCC] hover:text-white transition-colors">
                Funcionalidades
              </button>
              <button onClick={() => scrollToSection('pricing')} className="block w-full text-left text-[#CCCCCC] hover:text-white transition-colors">
                Preços
              </button>
              <Link to="/about" className="block text-[#CCCCCC] hover:text-white transition-colors" onClick={() => setIsMenuOpen(false)}>
                Sobre
              </Link>
              <Link to="/contact" className="block text-[#CCCCCC] hover:text-white transition-colors" onClick={() => setIsMenuOpen(false)}>
                Contato
              </Link>
              
              <div className="pt-4 border-t border-[#4B5563]/20">
                {user ? <div className="space-y-2">
                    <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" className="w-full text-white hover:bg-[#3B82F6]/20">
                        Dashboard
                      </Button>
                    </Link>
                    <Button onClick={() => {
                handleSignOut();
                setIsMenuOpen(false);
              }} variant="outline" className="w-full border-[#3B82F6] text-[#3B82F6] hover:bg-[#3B82F6] hover:text-white">
                      Sair
                    </Button>
                  </div> : <div className="space-y-2">
                    <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" className="w-full text-white hover:bg-[#3B82F6]/20">
                        Entrar
                      </Button>
                    </Link>
                    <Link to="/auth?mode=signup" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white">
                        Começar Grátis
                      </Button>
                    </Link>
                  </div>}
              </div>
            </nav>
          </div>}
      </div>
    </header>;
};