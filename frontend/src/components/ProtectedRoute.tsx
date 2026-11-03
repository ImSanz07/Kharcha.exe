// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { getToken } from "../utils/auth/auth";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = getToken();
  if (!token) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default ProtectedRoute;
