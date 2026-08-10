import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { axiosBase } from "../api/axios";

interface Props {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: Props) {
  const { isAuthenticated, setAuth, logout, setLoading } = useAuthStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setChecked(true);
      setLoading(false);
      return;
    }

    axiosBase
      .post("/auth/refresh")
      .then(({ data }) => {
        setAuth(data.accessToken, data.user);
      })
      .catch(() => {
        logout();
      })
      .finally(() => {
        setChecked(true);
        setLoading(false);
      });
  }, []);

  if (!checked) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
