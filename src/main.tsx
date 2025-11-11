import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppLayout } from "./components/layout/AppLayout.tsx";
import Index from "./pages/Index.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Projects from "./pages/Projects.tsx";
import Documents from "./pages/Documents.tsx";
import RFIs from "./pages/RFIs.tsx";
import Messages from "./pages/Messages.tsx";
import Tenders from "./pages/Tenders.tsx";
import Financials from "./pages/Financials.tsx";
import TenderResponse from "./pages/TenderResponse.tsx";
import TenderReviewDemo from "./pages/TenderReviewDemo.tsx";
import TenderBuilder from "./pages/TenderBuilder.tsx";
import Auth from "./pages/Auth.tsx";
import Testing from "./pages/Testing.tsx";
import NotFound from "./pages/NotFound.tsx";
import AcceptInvitation from "./pages/AcceptInvitation.tsx";
import ProjectJoin from "./pages/ProjectJoin.tsx";
import ProjectInvite from "./pages/ProjectInvite.tsx";
import JoinProject from "./pages/JoinProject.tsx";
import Calendar from "./pages/Calendar.tsx";
import TodoList from "./pages/TodoList.tsx";

// Admin pages
import AdminAuth from "./pages/AdminAuth.tsx";
import AdminIndex from "./pages/AdminIndex.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import AdminApprovals from "./pages/AdminApprovals.tsx";
import AdminEmails from "./pages/AdminEmails.tsx";
import AdminSettings from "./pages/AdminSettings.tsx";

// Public marketing pages
import Home from "./pages/public/Home.tsx";
import About from "./pages/public/About.tsx";
import Features from "./pages/public/Features.tsx";
import Pricing from "./pages/public/Pricing.tsx";
import Contact from "./pages/public/Contact.tsx";
import Privacy from "./pages/public/Privacy.tsx";
import Terms from "./pages/public/Terms.tsx";
import StyleGuide from "./pages/StyleGuide.tsx";

import "./index.css";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { ErrorBoundary } from "./components/ui/error-boundary.tsx";
import { NotificationProvider } from "./context/NotificationContext.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { RealtimeProvider } from "./context/RealtimeContext.tsx";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <RealtimeProvider>
          <ThemeProvider>
            <NotificationProvider>
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    {/* Public marketing pages */}
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/features" element={<Features />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    
                    {/* Auth pages */}
                    <Route path="/auth" element={<Auth />} />
                    
                    {/* App pages (authenticated) */}
                    <Route path="/app" element={<AppLayout><Index /></AppLayout>} />
                    <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
                    <Route path="/projects" element={<AppLayout><Projects /></AppLayout>} />
                    <Route path="/documents" element={<AppLayout><Documents /></AppLayout>} />
                    <Route path="/rfis" element={<AppLayout><RFIs /></AppLayout>} />
                    <Route path="/messages" element={<AppLayout><Messages /></AppLayout>} />
                    <Route path="/tenders" element={<AppLayout><Tenders /></AppLayout>} />
                    <Route path="/tenders/:tenderId" element={<AppLayout><Tenders /></AppLayout>} />
                    <Route path="/tenders/:tenderId/builder" element={<AppLayout><TenderBuilder /></AppLayout>} />
                    <Route path="/calendar" element={<AppLayout><Calendar /></AppLayout>} />
                    <Route path="/todo-list" element={<AppLayout><TodoList /></AppLayout>} />
                    <Route path="/financials" element={<AppLayout><Financials /></AppLayout>} />
                    <Route path="/tender-review-demo" element={<TenderReviewDemo />} />
                    <Route path="/testing" element={<AppLayout><Testing /></AppLayout>} />
                    
                    {/* Invitation and join pages */}
                    <Route path="/accept-invitation" element={<AcceptInvitation />} />
                    <Route path="/projects/:projectId/join" element={<ProjectJoin />} />
                    <Route path="/invite/:token" element={<ProjectInvite />} />
                    <Route path="/join/:token" element={<JoinProject />} />
                    
                    {/* Admin pages */}
                    <Route path="/admin/login" element={<AdminAuth />} />
                    <Route path="/admin" element={<AdminIndex />} />
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/approvals" element={<AdminApprovals />} />
                    <Route path="/admin/emails" element={<AdminEmails />} />
                    <Route path="/admin/settings" element={<AdminSettings />} />
                    <Route path="/admin/style-guide" element={<StyleGuide />} />

                    <Route path="/style-guide" element={<Navigate to="/admin/style-guide" replace />} />
                    
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </QueryClientProvider>
            </NotificationProvider>
          </ThemeProvider>
        </RealtimeProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
