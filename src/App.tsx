import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Index from './pages/Index';
import Auth from './pages/Auth';
import EmailConfirmation from './pages/EmailConfirmation';
import EmailConfirmed from './pages/EmailConfirmed';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Quiz from './pages/Quiz';
import Tools from './pages/Tools';
import History from './pages/History';
import Agents from './pages/Agents';
import NotFound from './pages/NotFound';
import Checkout from './pages/Checkout';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { TutorialProvider } from './contexts/TutorialContext';
import { FloatingAgentChat } from './components/chat/FloatingAgentChat';
import { ProtectedRoute } from './components/ProtectedRoute';
import Ads from './pages/Ads';
import SalesVideos from './pages/SalesVideos';
import Pages from './pages/Pages';
import Content from './pages/Content';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <TutorialProvider>
            <Router>
              <div className="min-h-screen bg-[#0A0A0A] font-inter">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/email-confirmation" element={<EmailConfirmation />} />
                  <Route path="/email-confirmed" element={<EmailConfirmed />} />
                  <Route path="/checkout" element={<Checkout />} />
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
    </QueryClientProvider>
  );
}

export default App;
