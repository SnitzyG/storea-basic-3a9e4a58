import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Projects from "./pages/Projects";
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
          <Route path="/auth" element={<Auth />} />
          <Route path="/projects" element={
            <AppLayout>
              <Projects />
            </AppLayout>
          } />
          <Route path="/tenders" element={
            <AppLayout>
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold mb-4">Tenders</h1>
                <p className="text-muted-foreground">Tender management coming soon</p>
              </div>
            </AppLayout>
          } />
          <Route path="/documents" element={
            <AppLayout>
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold mb-4">Documents</h1>
                <p className="text-muted-foreground">Document management coming soon</p>
              </div>
            </AppLayout>
          } />
          <Route path="/messages" element={
            <AppLayout>
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold mb-4">Messages</h1>
                <p className="text-muted-foreground">Messaging system coming soon</p>
              </div>
            </AppLayout>
          } />
          <Route path="/rfis" element={
            <AppLayout>
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold mb-4">RFIs</h1>
                <p className="text-muted-foreground">RFI management coming soon</p>
              </div>
            </AppLayout>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
