import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient } from 'react-query';

import Index from './pages/Index';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Quiz from './pages/Quiz';
import Tools from './pages/Tools';
import History from './pages/History';
import Agents from './pages/Agents';
import NotFound from './pages/NotFound';
import { useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { TutorialProvider } from './contexts/TutorialContext';
import FloatingAgentChat from './components/FloatingAgentChat';
import Ads from './pages/Ads';
import SalesVideos from './pages/SalesVideos';
import Pages from './pages/Pages';
import Content from './pages/Content';

function App() {
  return (
    <QueryClient>
      <AuthProvider>
        <AppProvider>
          <TutorialProvider>
            <Router>
              <div className="min-h-screen bg-[#0A0A0A] font-inter">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/products" 
                    element={
                      <ProtectedRoute>
                        <Products />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/quiz" 
                    element={
                      <ProtectedRoute>
                        <Quiz />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/tools" 
                    element={
                      <ProtectedRoute>
                        <Tools />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/history" 
                    element={
                      <ProtectedRoute>
                        <History />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/agents" 
                    element={
                      <ProtectedRoute>
                        <Agents />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/ads" 
                    element={
                      <ProtectedRoute>
                        <Ads />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/sales-videos" 
                    element={
                      <ProtectedRoute>
                        <SalesVideos />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/pages" 
                    element={
                      <ProtectedRoute>
                        <Pages />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/content" 
                    element={
                      <ProtectedRoute>
                        <Content />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Toaster />
                <FloatingAgentChat />
              </div>
            </Router>
          </TutorialProvider>
        </AppProvider>
      </AuthProvider>
    </QueryClient>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log('User state:', user);
  }, [user]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

export default App;
