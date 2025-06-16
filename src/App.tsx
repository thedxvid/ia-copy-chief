
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { AppProvider } from "./contexts/AppContext";
import { TutorialProvider } from "./contexts/TutorialContext";
import { TutorialOverlay } from "./components/tutorial/TutorialOverlay";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ChatLoading } from "./components/chat/ChatLoading";

// Lazy load pages
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Quiz = lazy(() => import("./pages/Quiz"));
const History = lazy(() => import("./pages/History"));
const Products = lazy(() => import("./pages/Products"));
const Tools = lazy(() => import("./pages/Tools"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Checkout = lazy(() => import("./pages/Checkout"));
const EmailConfirmation = lazy(() => import("./pages/EmailConfirmation"));
const EmailConfirmed = lazy(() => import("./pages/EmailConfirmed"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Ads = lazy(() => import("./pages/Ads"));
const Content = lazy(() => import("./pages/Content"));
const Pages = lazy(() => import("./pages/Pages"));
const SalesVideos = lazy(() => import("./pages/SalesVideos"));
const Chat = lazy(() => import("./pages/Chat"));

const queryClient = new QueryClient();

const LoadingFallback = ({ isChat = false }: { isChat?: boolean }) => {
  if (isChat) {
    return <ChatLoading />;
  }
  return (
    <div className="min-h-screen bg-background font-inter flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppProvider>
        <TutorialProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-background font-inter">
              <Routes>
                <Route path="/" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <Index />
                  </Suspense>
                } />
                <Route path="/auth" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <Auth />
                  </Suspense>
                } />
                <Route path="/about" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <About />
                  </Suspense>
                } />
                <Route path="/contact" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <Contact />
                  </Suspense>
                } />
                <Route path="/privacy" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <Privacy />
                  </Suspense>
                } />
                <Route path="/terms" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <Terms />
                  </Suspense>
                } />
                <Route path="/checkout" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <Checkout />
                  </Suspense>
                } />
                <Route path="/email-confirmation" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <EmailConfirmation />
                  </Suspense>
                } />
                <Route path="/email-confirmed" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <EmailConfirmed />
                  </Suspense>
                } />
                
                {/* Protected Routes */}
                <Route path="/dashboard" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <ProtectedRoute><Dashboard /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/quiz" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <ProtectedRoute><Quiz /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/history" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <ProtectedRoute><History /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/products" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <ProtectedRoute><Products /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/tools" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <ProtectedRoute><Tools /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/admin" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <ProtectedRoute><Admin /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/ads" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <ProtectedRoute><Ads /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/content" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <ProtectedRoute><Content /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/pages" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <ProtectedRoute><Pages /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/sales-videos" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <ProtectedRoute><SalesVideos /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/chat" element={
                  <Suspense fallback={<LoadingFallback isChat={true} />}>
                    <ProtectedRoute><Chat /></ProtectedRoute>
                  </Suspense>
                } />
                
                <Route path="*" element={
                  <Suspense fallback={<LoadingFallback />}>
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
