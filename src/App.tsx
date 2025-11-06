import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useGlobalRealtime } from "@/hooks/useGlobalRealtime";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Documents from "./pages/Documents";
import Messages from "./pages/Messages";
import RFIs from "./pages/RFIs";
import Tenders from "./pages/Tenders";
import Financials from "./pages/Financials";
import Testing from "./pages/Testing";
import TenderResponse from "./pages/TenderResponse";
import TenderReviewDemo from "./pages/TenderReviewDemo";
import AcceptInvitation from "./pages/AcceptInvitation";
import ProjectJoin from "./pages/ProjectJoin";
import PropertyZoning from "./pages/PropertyZoning";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppWithRealtime = () => {
  useGlobalRealtime(); // Enable global real-time subscriptions
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppWithRealtime />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <AppLayout>
              <Index />
            </AppLayout>
          } />
          <Route path="/dashboard" element={
            <AppLayout>
              <Dashboard />
            </AppLayout>
          } />
          <Route path="/auth" element={<Auth />} />
          <Route path="/projects" element={
            <AppLayout>
              <Projects />
            </AppLayout>
          } />
          <Route path="/tenders" element={
            <AppLayout>
              <Tenders />
            </AppLayout>
          } />
          <Route path="/documents" element={
            <AppLayout>
              <Documents />
            </AppLayout>
          } />
          <Route path="/messages" element={
            <AppLayout>
              <Messages />
            </AppLayout>
          } />
          <Route path="/rfis" element={
            <AppLayout>
              <RFIs />
            </AppLayout>
          } />
          <Route path="/financials" element={
            <AppLayout>
              <Financials />
            </AppLayout>
          } />
          <Route path="/testing" element={
            <AppLayout>
              <Testing />
            </AppLayout>
          } />
          <Route path="/admin" element={
            <AppLayout>
              <Admin />
            </AppLayout>
          } />
          <Route path="/tender/:tenderId" element={<TenderResponse />} />
          <Route path="/tender-review-demo" element={<TenderReviewDemo />} />
          <Route path="/accept-invitation" element={<AcceptInvitation />} />
          <Route path="/projects/:projectId/join" element={<ProjectJoin />} />
          <Route 
            path="/property-zoning" 
            element={
              <AppLayout>
                <PropertyZoning />
              </AppLayout>
            } 
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
