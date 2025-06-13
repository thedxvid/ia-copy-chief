
import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#121212]">
        <AppSidebar />
        <SidebarInset className="flex-1 bg-[#121212]">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-[#4B5563]/20 px-4">
            <SidebarTrigger className="text-white hover:bg-[#2A2A2A]" />
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
