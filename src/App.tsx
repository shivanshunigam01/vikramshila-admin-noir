import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLayout from "./components/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Schemes from "./pages/admin/Schemes";
import Testimonials from "./pages/admin/Testimonials";
import NewLaunches from "./pages/admin/NewLaunches";
import Services from "./pages/admin/Services";
import Enquiries from "./pages/admin/Enquiries";
import ProductDetails from "./pages/ProductDetails";
import BannerImageUpload from "./pages/admin/BannerImageUpload";
import Leads from "./pages/Leads";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="schemes" element={<Schemes />} />
            <Route path="testimonials" element={<Testimonials />} />
            <Route path="launches" element={<NewLaunches />} />
            <Route path="services" element={<Services />} />
            <Route path="enquiries" element={<Enquiries />} />
            <Route path="leads" element={<Leads />} />

            <Route path="products/:id" element={<ProductDetails />} />
            <Route path="banner" element={<BannerImageUpload />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
