import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import StoreSetup from "./pages/StoreSetup";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
import EditProduct from "./pages/EditProduct";
import ProductPreview from "./pages/ProductPreview";
import Orders from "./pages/Orders";
import StoreSettings from "./pages/StoreSettings";
import VerificationPage from "./pages/dashboard/VerificationPage";
import TeamMembersPage from "./pages/dashboard/TeamMembersPage";
import InviteAccept from "./pages/InviteAccept";
import Storefront from "./pages/Storefront";
import Checkout from "./pages/Checkout";
import ResetPassword from "./pages/ResetPassword";
import Legal from "./pages/Legal";
import GrowthToolsPage from "./pages/dashboard/GrowthToolsPage";
import OffersPage from "./pages/dashboard/OffersPage";
import AgencyApply from "./pages/AgencyApply";
import AgencyDashboard from "./pages/agency/AgencyDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/setup" element={<StoreSetup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/products" element={<Products />} />
            <Route path="/dashboard/products/new" element={<AddProduct />} />
            <Route path="/dashboard/products/:id/edit" element={<EditProduct />} />
            <Route path="/dashboard/products/:id/preview" element={<ProductPreview />} />
            <Route path="/dashboard/orders" element={<Orders />} />
            <Route path="/dashboard/settings" element={<StoreSettings />} />
            <Route path="/dashboard/verification" element={<VerificationPage />} />
            <Route path="/dashboard/growth" element={<GrowthToolsPage />} />
            <Route path="/dashboard/offers" element={<OffersPage />} />
            <Route path="/dashboard/team" element={<TeamMembersPage />} />
            <Route path="/invite/:token" element={<InviteAccept />} />
            <Route path="/store/:slug" element={<Storefront />} />
            <Route path="/store/:slug/checkout" element={<Checkout />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/legal/:page" element={<Legal />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/agency/apply" element={<AgencyApply />} />
            <Route path="/agency/dashboard" element={<AgencyDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
