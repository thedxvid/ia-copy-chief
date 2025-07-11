
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot } from 'lucide-react';

const Footer = () => {
  const navigate = useNavigate();

  const handleLinkClick = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0F0F0F] text-[#CCCCCC] border-t border-[#4B5563]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and About */}
          <div className="space-y-4 md:col-span-1 lg:col-span-1">
            <button 
              onClick={() => handleLinkClick('/')}
              className="flex items-center space-x-2 text-left"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">IA CopyChief</span>
            </button>
            <p className="text-sm">
              Revolucione suas vendas com a inteligência artificial mais avançada para copywriting.
            </p>
          </div>

          {/* Links */}
          <div className="lg:col-start-2">
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Produto</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <button 
                  onClick={() => handleLinkClick('/#features')}
                  className="text-sm hover:text-white transition-colors text-left"
                >
                  Funcionalidades
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleLinkClick('/#pricing')}
                  className="text-sm hover:text-white transition-colors text-left"
                >
                  Preços
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleLinkClick('/#agents')}
                  className="text-sm hover:text-white transition-colors text-left"
                >
                  Agentes IA
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Empresa</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <button 
                  onClick={() => handleLinkClick('/about')}
                  className="text-sm hover:text-white transition-colors text-left"
                >
                  Sobre Nós
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleLinkClick('/contact')}
                  className="text-sm hover:text-white transition-colors text-left"
                >
                  Contato
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Legal</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <button 
                  onClick={() => handleLinkClick('/terms')}
                  className="text-sm hover:text-white transition-colors text-left"
                >
                  Termos de Serviço
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleLinkClick('/privacy')}
                  className="text-sm hover:text-white transition-colors text-left"
                >
                  Política de Privacidade
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-[#4B5563]/20 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-center sm:text-left">
            &copy; {new Date().getFullYear()} CopyChief. Todos os direitos reservados.
          </p>
          <div className="flex space-x-4 mt-4 sm:mt-0">
             {/* Social media links can go here in the future */}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
