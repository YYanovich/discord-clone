import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

interface IProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: IProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#36393f] flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
