import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppProvider } from '@/contexts/AppContext';
import LandingPage from '@/pages/LandingPage';
import AuthPage from '@/pages/AuthPage';
import Dashboard from '@/pages/Dashboard';
import Tools from '@/pages/Tools';
import History from '@/pages/History';
import Quiz from '@/pages/Quiz';
import Admin from '@/pages/Admin';
import NotFound from '@/pages/NotFound';
import { Toaster } from "@/components/ui/toaster"
import { SonnerToaster } from 'sonner';
import { QueryClient, QueryClientProvider } from 'react-query';
import { TokenUpgradeProvider } from '@/contexts/TokenUpgradeContext';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppProvider>
            <TokenUpgradeProvider>
              <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-inter">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/tools" element={<Tools />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/quiz" element={<Quiz />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Toaster />
                <SonnerToaster />
              </div>
            </TokenUpgradeProvider>
          </AppProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
