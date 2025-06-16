
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { AppProvider } from "./contexts/AppContext";
import { TutorialProvider } from "./contexts/TutorialContext";
import { TutorialOverlay } from "./components/tutorial/TutorialOverlay";
import { ProtectedRoute } from "./components/ProtectedRoute";

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppProvider>
        <TutorialProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-background font-inter">
              <Suspense fallback={<div>Loading...</div>}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/email-confirmation" element={<EmailConfirmation />} />
                  <Route path="/email-confirmed" element={<EmailConfirmed />} />
                  
                  {/* Protected Routes */}
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
                  <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                  <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
                  <Route path="/tools" element={<ProtectedRoute><Tools /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                  <Route path="/ads" element={<ProtectedRoute><Ads /></ProtectedRoute>} />
                  <Route path="/content" element={<ProtectedRoute><Content /></ProtectedRoute>} />
                  <Route path="/pages" element={<ProtectedRoute><Pages /></ProtectedRoute>} />
                  <Route path="/sales-videos" element={<ProtectedRoute><SalesVideos /></ProtectedRoute>} />
                  <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
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
