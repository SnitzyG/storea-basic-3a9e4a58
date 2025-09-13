import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import TenderResponse from "./pages/TenderResponse.tsx";
import TenderReviewDemo from "./pages/TenderReviewDemo.tsx";
import Auth from "./pages/Auth.tsx";
import Testing from "./pages/Testing.tsx";
import NotFound from "./pages/NotFound.tsx";
import AcceptInvitation from "./pages/AcceptInvitation.tsx";
import "./index.css";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { ErrorBoundary } from "./components/ui/error-boundary.tsx";
import { NotificationProvider } from "./context/NotificationContext.tsx";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <NotificationProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <Toaster />
              <Sonner />
               <BrowserRouter>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/documents" element={<Documents />} />
                    <Route path="/rfis" element={<RFIs />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/tenders" element={<Tenders />} />
                    <Route path="/tender-response" element={<TenderResponse />} />
                    <Route path="/tender-review-demo" element={<TenderReviewDemo />} />
                    <Route path="/testing" element={<Testing />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/accept-invitation" element={<AcceptInvitation />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AppLayout>
               </BrowserRouter>
            </TooltipProvider>
          </QueryClientProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);
