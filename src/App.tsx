
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import { TutorialProvider } from "@/contexts/TutorialContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import History from "./pages/History";
import Chat from "./pages/Chat";
import Agents from "./pages/Agents";
import Quiz from "./pages/Quiz";
import SalesVideos from "./pages/SalesVideos";
import Ads from "./pages/Ads";
import Pages from "./pages/Pages";
import Content from "./pages/Content";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import EmailConfirmation from "./pages/EmailConfirmation";
import EmailConfirmed from "./pages/EmailConfirmed";
import Admin from "./pages/Admin";
import Checkout from "./pages/Checkout";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppProvider>
            <TutorialProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/email-confirmation" element={<EmailConfirmation />} />
                  <Route path="/email-confirmed" element={<EmailConfirmed />} />
                  <Route path="/checkout" element={<Checkout />} />
                  
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/products" element={
                    <ProtectedRoute>
                      <Products />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/history" element={
                    <ProtectedRoute>
                      <History />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/chat" element={
                    <ProtectedRoute>
                      <Chat />
                    </ProtectedRoute>
                  } />

                  <Route path="/agents" element={
                    <ProtectedRoute>
                      <Agents />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/quiz" element={
                    <ProtectedRoute>
                      <Quiz />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/sales-videos" element={
                    <ProtectedRoute>
                      <SalesVideos />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/ads" element={
                    <ProtectedRoute>
                      <Ads />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/pages" element={
                    <ProtectedRoute>
                      <Pages />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/content" element={
                    <ProtectedRoute>
                      <Content />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/admin" element={
                    <ProtectedRoute>
                      <Admin />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TutorialProvider>
          </AppProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
