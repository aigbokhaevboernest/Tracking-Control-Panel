import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { FullScreenSpinner } from "@/components/Spinner";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isAdmin, loading } = useAuth();
  if (loading) return <FullScreenSpinner />;
  if (!session || !isAdmin) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
