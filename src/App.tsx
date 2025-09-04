import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Documents from "./pages/Documents";
import Messages from "./pages/Messages";
import RFIs from "./pages/RFIs";
import Tenders from "./pages/Tenders";
import Testing from "./pages/Testing";
import TenderResponse from "./pages/TenderResponse";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
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
          <Route path="/testing" element={
            <AppLayout>
              <Testing />
            </AppLayout>
          } />
          <Route path="/tender-response/:tenderId" element={<TenderResponse />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
