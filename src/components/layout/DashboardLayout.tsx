
import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { TokenWidget } from '@/components/tokens/TokenWidget';
import { TutorialProvider } from '@/contexts/TutorialContext';
import { TutorialOverlay } from '@/components/tutorial/TutorialOverlay';
import { Bot } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <TutorialProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-[#121212] overflow-x-hidden">
          <div data-tutorial="sidebar">
            <AppSidebar />
          </div>
          <SidebarInset className="flex-1 bg-[#121212] min-w-0 overflow-x-hidden">
            {/* Header fixo no mobile */}
            <header className="fixed md:relative top-0 left-0 right-0 z-40 flex h-14 sm:h-16 shrink-0 items-center justify-between gap-2 border-b border-[#4B5563]/20 px-3 sm:px-4 bg-[#121212] md:bg-transparent backdrop-blur-sm md:backdrop-blur-none">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-white hover:bg-[#2A2A2A] flex-shrink-0">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7h18M3 12h14M3 17h10"
                    />
                  </svg>
                  <span className="sr-only">Toggle Sidebar</span>
                </SidebarTrigger>
                
                {/* Logo centralizada no mobile */}
                <div className="flex items-center gap-2 md:hidden">
                  <div className="w-7 h-7 bg-[#3B82F6] rounded-xl flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h1 className="text-base font-bold text-white">CopyChief</h1>
                  </div>
                </div>
              </div>

              {/* Token Widget no lado direito */}
              <div className="flex items-center gap-2">
                <div data-tutorial="token-widget">
                  <TokenWidget />
                </div>
              </div>
            </header>
            {/* Main com padding-top no mobile para compensar o header fixo */}
            <main className="flex-1 p-3 sm:p-4 lg:p-6 max-w-full overflow-x-hidden pt-16 md:pt-3">
              <div className="max-w-full" data-tutorial="dashboard-content">
                {children}
              </div>
            </main>
          </SidebarInset>
          
          {/* Apenas o indicador tutorial para o chat */}
          <div data-tutorial="floating-chat" className="fixed bottom-6 right-6 z-50 pointer-events-none opacity-0">
            {/* Div vazia apenas para o tutorial */}
          </div>
        </div>
        
        <TutorialOverlay />
      </SidebarProvider>
    </TutorialProvider>
  );
};
