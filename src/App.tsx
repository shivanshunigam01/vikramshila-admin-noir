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
import Grievances from "./pages/admin/Grievances";
import DSELeads from "./pages/DseLeads";
import UserRegistration from "./pages/UserRegistration";
import DSEEnquiries from "./pages/DseEnquiries";
import ReportsDashboard from "./pages/ReportsDashboard";
import DSEList from "./pages/DSEList";
import DSELocation from "./pages/DSELocation";
import DSEMapAll from "./pages/DSEMapAll";
import DSEReports from "./pages/DSEReports";
import DSEReportsDse from "./pages/DSEReportsDse";
import DSETrackDetail from "./pages/DSETrackDetail";
import Videos from "./pages/Videos";
import CompetitionTruckFinder from "./pages/CompetitionTruckFinder";
import CompetitionCompare from "./pages/CompetitionCompare";
import CompetitionProducts from "./pages/admin/CompetitionProducts";
import CompetitionProductDetails from "./pages/CompetitionProductDetails";
import DSEPlanner from "./pages/Planner";
import PlannerReportsAdmin from "./pages/admin/PlannerReports";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route
            path="/competition/finder"
            element={<CompetitionTruckFinder />}
          />
          <Route path="/competition/compare" element={<CompetitionCompare />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="dse-planner" element={<DSEPlanner />} />
            <Route path="planner-reports" element={<PlannerReportsAdmin />} />
            <Route path="schemes" element={<Schemes />} />
            <Route path="testimonials" element={<Testimonials />} />
            <Route path="launches" element={<NewLaunches />} />
            <Route path="services" element={<Services />} />
            <Route path="enquiries" element={<Enquiries />} />
            <Route path="grievances" element={<Grievances />} />
            <Route path="videos" element={<Videos />} />

            <Route path="leads" element={<Leads />} />

            <Route path="products/:id" element={<ProductDetails />} />
            <Route
              path="competition-products"
              element={<CompetitionProducts />}
            />
            <Route
              path="/admin/competition-products/:id"
              element={<CompetitionProductDetails />}
            />
            <Route path="banner" element={<BannerImageUpload />} />
            <Route path="dse-leads" element={<DSELeads />} />
            <Route path="dse-enquiry" element={<DSEEnquiries />} />
            <Route path="users" element={<UserRegistration />} />
            <Route path="reports" element={<ReportsDashboard />} />
            <Route path="dse" element={<DSEMapAll />} />
            <Route path="/admin/dse-reports" element={<DSEReports />} />
            <Route
              path="/admin/dse-reports/:dseId"
              element={<DSEReportsDse />}
            />

            <Route
              path="/admin/dse-location/:dseId"
              element={<DSELocation />}
            />
          </Route>
          <Route path="/admin/dse-track/:dseId" element={<DSETrackDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
