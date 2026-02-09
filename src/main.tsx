import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppLayout } from "./components/layout/AppLayout.tsx";
import { RequireCompleteProfile } from "./components/auth/RequireCompleteProfile.tsx";

// Critical pages - loaded immediately
import Home from "./pages/public/Home.tsx";
import Auth from "./pages/Auth.tsx";
import NotFound from "./pages/NotFound.tsx";

// Lazy load non-critical pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Projects = lazy(() => import("./pages/Projects.tsx"));
const Documents = lazy(() => import("./pages/Documents.tsx"));
const RFIs = lazy(() => import("./pages/RFIs.tsx"));
const Messages = lazy(() => import("./pages/Messages.tsx"));
const Tenders = lazy(() => import("./pages/Tenders.tsx"));
const Financials = lazy(() => import("./pages/Financials.tsx"));
const TenderResponse = lazy(() => import("./pages/TenderResponse.tsx"));
const TenderReviewDemo = lazy(() => import("./pages/TenderReviewDemo.tsx"));
const TenderBuilder = lazy(() => import("./pages/TenderBuilder.tsx"));
const ProfileSetup = lazy(() => import("./pages/ProfileSetup.tsx"));
const Testing = lazy(() => import("./pages/Testing.tsx"));
const AcceptInvitation = lazy(() => import("./pages/AcceptInvitation.tsx"));
const ProjectJoin = lazy(() => import("./pages/ProjectJoin.tsx"));
const ProjectInvite = lazy(() => import("./pages/ProjectInvite.tsx"));
const JoinProject = lazy(() => import("./pages/JoinProject.tsx"));
const Calendar = lazy(() => import("./pages/Calendar.tsx"));
const TodoList = lazy(() => import("./pages/TodoList.tsx"));

// Admin pages - lazy loaded
const AdminAuth = lazy(() => import("./pages/AdminAuth.tsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.tsx"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement.tsx"));
const AuditLogs = lazy(() => import("./pages/admin/AuditLogs.tsx"));
const SystemActivity = lazy(() => import("./pages/admin/SystemActivity.tsx"));
const SystemAlerts = lazy(() => import("./pages/admin/SystemAlerts.tsx"));
const AdminApprovals = lazy(() => import("./pages/AdminApprovals.tsx"));
const AdminSettings = lazy(() => import("./pages/AdminSettings.tsx"));
const Documentation = lazy(() => import("./pages/admin/Documentation.tsx"));

// Public marketing pages - lazy loaded with error handling
const About = lazy(() => import("./pages/public/About.tsx").catch(err => {
  console.error('Failed to load About page:', err);
  return { default: () => <div className="flex items-center justify-center min-h-screen"><p className="text-destructive">Error loading page. Please refresh.</p></div> };
}));

const Features = lazy(() => import("./pages/public/Features.tsx").catch(err => {
  console.error('Failed to load Features page:', err);
  return { default: () => <div className="flex items-center justify-center min-h-screen"><p className="text-destructive">Error loading page. Please refresh.</p></div> };
}));

const Pricing = lazy(() => import("./pages/public/Pricing.tsx").catch(err => {
  console.error('Failed to load Pricing page:', err);
  return { default: () => <div className="flex items-center justify-center min-h-screen"><p className="text-destructive">Error loading page. Please refresh.</p></div> };
}));

const Contact = lazy(() => import("./pages/public/Contact.tsx").catch(err => {
  console.error('Failed to load Contact page:', err);
  return { default: () => <div className="flex items-center justify-center min-h-screen"><p className="text-destructive">Error loading page. Please refresh.</p></div> };
}));

const Privacy = lazy(() => import("./pages/public/Privacy.tsx").catch(err => {
  console.error('Failed to load Privacy page:', err);
  return { default: () => <div className="flex items-center justify-center min-h-screen"><p className="text-destructive">Error loading page. Please refresh.</p></div> };
}));

const Terms = lazy(() => import("./pages/public/Terms.tsx").catch(err => {
  console.error('Failed to load Terms page:', err);
  return { default: () => <div className="flex items-center justify-center min-h-screen"><p className="text-destructive">Error loading page. Please refresh.</p></div> };
}));

const StyleGuide = lazy(() => import("./pages/StyleGuide.tsx").catch(err => {
  console.error('Failed to load StyleGuide page:', err);
  return { default: () => <div className="flex items-center justify-center min-h-screen"><p className="text-destructive">Error loading page. Please refresh.</p></div> };
}));

import "./index.css";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { ErrorBoundary } from "./components/ui/error-boundary.tsx";
import { NotificationProvider } from "./context/NotificationContext.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { RealtimeProvider } from "./context/RealtimeContext.tsx";

const queryClient = new QueryClient();

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  const msg = String(event.reason?.message || event.reason || '');
  // Suppress known benign React DOM reconciliation errors
  if (msg.includes('removeChild') || msg.includes('insertBefore') || msg.includes('not a child')) {
    console.warn('[Suppressed] React DOM reconciliation error:', msg);
    event.preventDefault();
    return;
  }
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  const msg = String(event.error?.message || event.message || '');
  if (msg.includes('removeChild') || msg.includes('insertBefore') || msg.includes('not a child')) {
    console.warn('[Suppressed] React DOM reconciliation error:', msg);
    event.preventDefault();
    return;
  }
  console.error('Uncaught error:', event.error);
});

console.log('🚀 STOREA: Starting app initialization...');

try {
  const rootElement = document.getElementById("root");
  console.log('🚀 STOREA: Root element found:', !!rootElement);
  
  if (!rootElement) {
    throw new Error('Root element not found!');
  }
  
  const root = createRoot(rootElement);
  console.log('🚀 STOREA: React root created, rendering app...');
  
  root.render(
  <>
    <ErrorBoundary>
      <AuthProvider>
        <RealtimeProvider>
          <ThemeProvider>
            <NotificationProvider>
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                  <Suspense fallback={
                    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                      <p className="text-muted-foreground text-sm">Loading STOREA...</p>
                    </div>
                  }>
                    <Routes>
                      {/* Public marketing pages - redirect / to /home */}
                      <Route path="/" element={<Navigate to="/home" replace />} />
                      <Route path="/home" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/features" element={<Features />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    
                    {/* Auth pages */}
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/profile-setup" element={<ProfileSetup />} />
                    
                    {/* App pages (authenticated and profile complete) */}
                    <Route path="/dashboard" element={<RequireCompleteProfile><AppLayout><Dashboard /></AppLayout></RequireCompleteProfile>} />
                    <Route path="/projects" element={<RequireCompleteProfile><AppLayout><Projects /></AppLayout></RequireCompleteProfile>} />
                    <Route path="/documents" element={<RequireCompleteProfile><AppLayout><Documents /></AppLayout></RequireCompleteProfile>} />
                    <Route path="/rfis" element={<RequireCompleteProfile><AppLayout><RFIs /></AppLayout></RequireCompleteProfile>} />
                    <Route path="/messages" element={<RequireCompleteProfile><AppLayout><Messages /></AppLayout></RequireCompleteProfile>} />
                    <Route path="/tenders" element={<RequireCompleteProfile><AppLayout><Tenders /></AppLayout></RequireCompleteProfile>} />
                    <Route path="/tenders/:tenderId" element={<RequireCompleteProfile><AppLayout><Tenders /></AppLayout></RequireCompleteProfile>} />
                    <Route path="/tenders/:tenderId/builder" element={<RequireCompleteProfile><AppLayout><TenderBuilder /></AppLayout></RequireCompleteProfile>} />
                    <Route path="/calendar" element={<RequireCompleteProfile><AppLayout><Calendar /></AppLayout></RequireCompleteProfile>} />
                    <Route path="/todo-list" element={<RequireCompleteProfile><AppLayout><TodoList /></AppLayout></RequireCompleteProfile>} />
                    <Route path="/financials" element={<RequireCompleteProfile><AppLayout><Financials /></AppLayout></RequireCompleteProfile>} />
                    <Route path="/tender-review-demo" element={<TenderReviewDemo />} />
                    <Route path="/testing" element={<RequireCompleteProfile><AppLayout><Testing /></AppLayout></RequireCompleteProfile>} />
                    
                    {/* Invitation and join pages */}
                    <Route path="/accept-invitation" element={<AcceptInvitation />} />
                    <Route path="/projects/:projectId/join" element={<ProjectJoin />} />
                    <Route path="/invite/:token" element={<ProjectInvite />} />
                    <Route path="/join/:token" element={<JoinProject />} />
                    
                    {/* Admin pages */}
                    <Route path="/admin/login" element={<AdminAuth />} />
                    <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/users" element={<UserManagement />} />
                    <Route path="/admin/activity" element={<SystemActivity />} />
                    <Route path="/admin/logs" element={<AuditLogs />} />
                    <Route path="/admin/alerts" element={<SystemAlerts />} />
                    <Route path="/admin/approvals" element={<AdminApprovals />} />
                    <Route path="/admin/settings" element={<AdminSettings />} />
                    <Route path="/admin/documentation" element={<Documentation />} />
                    <Route path="/admin/style-guide" element={<StyleGuide />} />

                    <Route path="/style-guide" element={<Navigate to="/admin/style-guide" replace />} />
                    
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  </Suspense>
                </BrowserRouter>
              </TooltipProvider>
            </QueryClientProvider>
            </NotificationProvider>
          </ThemeProvider>
        </RealtimeProvider>
      </AuthProvider>
    </ErrorBoundary>
  </>
  );
} catch (error) {
  console.error('❌ Fatal error during React initialization:', error);
  // Show error in the page
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-center; min-height: 100vh; padding: 20px; background: #fff;">
        <div style="max-width: 600px; text-align: center;">
          <h1 style="color: #dc2626; font-size: 24px; margin-bottom: 16px;">Failed to Initialize App</h1>
          <p style="color: #666; margin-bottom: 16px;">There was a critical error loading the application.</p>
          <pre style="background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: left; overflow: auto; font-size: 12px;">
${error instanceof Error ? error.message + '\n' + error.stack : String(error)}
          </pre>
          <button onclick="window.location.reload()" style="margin-top: 16px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
            Reload Page
          </button>
        </div>
      </div>
    `;
  }
}
