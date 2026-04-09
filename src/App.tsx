import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import Dashboard from "@/pages/Dashboard";
import Inventory from "@/pages/Inventory";
import BarcodeScanner from "@/pages/BarcodeScanner";
import Sell from "@/pages/Sell";
import Forecasting from "@/pages/Forecasting";
import Alerts from "@/pages/Alerts";
import Recommendations from "@/pages/Recommendations";
import StaffManagement from "@/pages/StaffManagement";
import GstManagement from "@/pages/GstManagement";
import BillCharges from "@/pages/BillCharges";
import SalesReport from "@/pages/SalesReport";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

// Wake up the Render backend immediately (free tier sleeps after inactivity)
fetch('https://supplysync-ts7y.onrender.com/api/health').catch(() => {});

const WithLayout = ({ children }: { children: React.ReactNode }) => (
  <AppLayout>{children}</AppLayout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={<WithLayout><Dashboard /></WithLayout>} />
          <Route path="/inventory" element={<WithLayout><Inventory /></WithLayout>} />
          <Route path="/barcode" element={<WithLayout><BarcodeScanner /></WithLayout>} />
          <Route path="/sell" element={<WithLayout><Sell /></WithLayout>} />
          <Route path="/forecasting" element={<WithLayout><Forecasting /></WithLayout>} />
          <Route path="/alerts" element={<WithLayout><Alerts /></WithLayout>} />
          <Route path="/recommendations" element={<WithLayout><Recommendations /></WithLayout>} />
          <Route path="/staff" element={<WithLayout><StaffManagement /></WithLayout>} />
          <Route path="/gst" element={<WithLayout><GstManagement /></WithLayout>} />
          <Route path="/bill-charges" element={<WithLayout><BillCharges /></WithLayout>} />
          <Route path="/sales-report" element={<WithLayout><SalesReport /></WithLayout>} />
          <Route path="/settings" element={<WithLayout><Settings /></WithLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
