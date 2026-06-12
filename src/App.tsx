import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/auth/AuthProvider";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import AdminLayout from "@/pages/AdminLayout";
import DashboardPage from "@/pages/DashboardPage";
import ShipmentsPage from "@/pages/ShipmentsPage";
import UpdateShipmentPage from "@/pages/UpdateShipmentPage";
import DeleteShipmentPage from "@/pages/DeleteShipmentPage";
import InvoicesPage from "@/pages/InvoicesPage";
import HoldSettingsPage from "@/pages/AppConfigurationPage.tsx";
import CustomMessagePage from "@/pages/CustomMessagePage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Toaster richColors position="top-right" />
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/admin" element={<DashboardPage />} />
              <Route path="/admin/shipments" element={<ShipmentsPage />} />
              <Route path="/admin/update" element={<UpdateShipmentPage />} />
              <Route path="/admin/delete" element={<DeleteShipmentPage />} />
              <Route path="/admin/invoices" element={<InvoicesPage />} />
              <Route path="/admin/custom-message" element={<CustomMessagePage />} />
              <Route path="/admin/AppConfigurationPage.tsx" element={<AppConfigurationPage />} />

            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
