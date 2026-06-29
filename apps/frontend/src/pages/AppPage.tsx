import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import api from "../api/axios";

export default function AppPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      logout();
      navigate("/login");
    }
  };
  return (
    <div className="min-h-screen bg-[#36393f] flex flex-col items-center justify-center gap-4">
      <div className="bg-[#2f3136] rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-[#7289da] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
          {user?.username?.[0]?.toUpperCase() ?? "?"}
        </div>
        <h1 className="text-white text-xl font-bold mb-1">
          Hi, {user?.username}!
        </h1>
        <p className="text-[#b9bbbe] text-sm mb-6">{user?.email}</p>
        <p className="text-[#72767d] text-xs mb-6">
          FE2 feature: Discord layout will be here
        </p>
        <button
          onClick={handleLogout}
          className="bg-[#f04747] hover:bg-[#d84040] text-white px-6 py-2 rounded transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
