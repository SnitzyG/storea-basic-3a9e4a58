import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppLayout } from "./components/layout/AppLayout.tsx";
import { RequireCompleteProfile } from "./components/auth/RequireCompleteProfile.tsx";
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
import { AdminLayout } from "./components/admin/AdminLayout.tsx";

import AdminDashboard from "./pages/AdminDashboard.tsx";
import UserManagement from "./pages/admin/UserManagement.tsx";
import AuditLogs from "./pages/admin/AuditLogs.tsx";
import SystemActivity from "./pages/admin/SystemActivity.tsx";
import SystemAlerts from "./pages/admin/SystemAlerts.tsx";
import AdminApprovals from "./pages/AdminApprovals.tsx";
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
                    <Route path="/home" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/features" element={<Features />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    
                    {/* Auth pages */}
                    <Route path="/auth" element={<Auth />} />
                    
                    {/* App pages (authenticated and profile complete) */}
                    <Route path="/app" element={<RequireCompleteProfile><AppLayout><Index /></AppLayout></RequireCompleteProfile>} />
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
