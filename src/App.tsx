
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { AppProvider } from "./contexts/AppContext";
import { TutorialProvider } from "./contexts/TutorialContext";
import { TutorialOverlay } from "./components/tutorial/TutorialOverlay";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Skeleton } from "./components/ui/loading-skeleton";

// Import principais páginas diretamente (sem lazy loading)
import Dashboard from "./pages/Dashboard";
import Quiz from "./pages/Quiz";
import History from "./pages/History";
import Products from "./pages/Products";
import Tools from "./pages/Tools";
import Ads from "./pages/Ads";
import Content from "./pages/Content";
import Pages from "./pages/Pages";
import SalesVideos from "./pages/SalesVideos";
import Chat from "./pages/Chat";

// Lazy load apenas páginas menos utilizadas
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Checkout = lazy(() => import("./pages/Checkout"));
const EmailConfirmation = lazy(() => import("./pages/EmailConfirmation"));
const EmailConfirmed = lazy(() => import("./pages/EmailConfirmed"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      refetchOnWindowFocus: false,
    },
  },
});

const FastLoading = () => (
  <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-8 h-8 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin"></div>
      <div className="text-[#CCCCCC] text-sm">Carregando...</div>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppProvider>
        <TutorialProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-background font-inter">
              <Routes>
                <Route path="/" element={
                  <Suspense fallback={<FastLoading />}>
                    <Index />
                  </Suspense>
                } />
                <Route path="/auth" element={
                  <Suspense fallback={<FastLoading />}>
                    <Auth />
                  </Suspense>
                } />
                <Route path="/about" element={
                  <Suspense fallback={<FastLoading />}>
                    <About />
                  </Suspense>
                } />
                <Route path="/contact" element={
                  <Suspense fallback={<FastLoading />}>
                    <Contact />
                  </Suspense>
                } />
                <Route path="/privacy" element={
                  <Suspense fallback={<FastLoading />}>
                    <Privacy />
                  </Suspense>
                } />
                <Route path="/terms" element={
                  <Suspense fallback={<FastLoading />}>
                    <Terms />
                  </Suspense>
                } />
                <Route path="/checkout" element={
                  <Suspense fallback={<FastLoading />}>
                    <Checkout />
                  </Suspense>
                } />
                <Route path="/email-confirmation" element={
                  <Suspense fallback={<FastLoading />}>
                    <EmailConfirmation />
                  </Suspense>
                } />
                <Route path="/email-confirmed" element={
                  <Suspense fallback={<FastLoading />}>
                    <EmailConfirmed />
                  </Suspense>
                } />
                
                {/* Protected Routes - Carregamento direto para melhor performance */}
                <Route path="/dashboard" element={
                  <ProtectedRoute><Dashboard /></ProtectedRoute>
                } />
                <Route path="/quiz" element={
                  <ProtectedRoute><Quiz /></ProtectedRoute>
                } />
                <Route path="/history" element={
                  <ProtectedRoute><History /></ProtectedRoute>
                } />
                <Route path="/products" element={
                  <ProtectedRoute><Products /></ProtectedRoute>
                } />
                <Route path="/tools" element={
                  <ProtectedRoute><Tools /></ProtectedRoute>
                } />
                <Route path="/ads" element={
                  <ProtectedRoute><Ads /></ProtectedRoute>
                } />
                <Route path="/content" element={
                  <ProtectedRoute><Content /></ProtectedRoute>
                } />
                <Route path="/pages" element={
                  <ProtectedRoute><Pages /></ProtectedRoute>
                } />
                <Route path="/sales-videos" element={
                  <ProtectedRoute><SalesVideos /></ProtectedRoute>
                } />
                <Route path="/chat" element={
                  <ProtectedRoute><Chat /></ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <Suspense fallback={<FastLoading />}>
                    <ProtectedRoute><Admin /></ProtectedRoute>
                  </Suspense>
                } />
                
                <Route path="*" element={
                  <Suspense fallback={<FastLoading />}>
                    <NotFound />
                  </Suspense>
                } />
              </Routes>
              <TutorialOverlay />
              <Toaster />
            </div>
          </BrowserRouter>
        </TutorialProvider>
      </AppProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
