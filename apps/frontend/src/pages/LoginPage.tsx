import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuthStore } from "../store/authStore";
import { validateEmail } from "../utils/validation";
import { AxiosError } from "axios";
import type { FormEvent } from "react";
interface IFormErrors {
  email?: string;
  password?: string;
  username?: string;
  server?: string;
}
interface IBackendErrorResponse {
  message?: string;
}
export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<IFormErrors>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: IFormErrors = {};
    const emailErr = validateEmail(email);
    if (emailErr) newErrors.email = emailErr;
    if (!password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const { data } = await api.post("/auth/login", { email, password });
      setAuth(data.accessToken, data.user);
      navigate("/app");
    } catch (err) {
      const axiosError = err as AxiosError<IBackendErrorResponse>;
      setErrors({
        server:
          axiosError.response?.data?.message ?? "Incorrect login or password",
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="relative min-h-screen bg-zinc-950 flex items-center justify-center p-4 overflow-hidden selection:bg-indigo-500 selection:text-white font-sans">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-100 h-100 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-105 bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl rounded-2xl p-8 md:p-10 shadow-2xl shadow-black/80">
        <div className="text-center mb-8">
          <h1 className="text-zinc-100 text-3xl font-semibold tracking-tight mb-2">
            Welcome back
          </h1>
          <p className="text-zinc-500 text-sm">
            Enter your details to access your account
          </p>
        </div>

        {errors.server && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-5 text-red-400 text-xs text-center font-medium">
            {errors.server}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-400 text-xs font-medium tracking-wide">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email || errors.server)
                  setErrors((prev) => ({
                    ...prev,
                    email: undefined,
                    server: undefined,
                  }));
              }}
              className={`w-full bg-zinc-900/90 text-zinc-100 placeholder-zinc-600 rounded-lg px-3.5 py-2.5 text-sm
    border ${errors.email ? "border-red-500/50 focus:border-red-500" : "border-zinc-800 focus:border-indigo-500"}
    focus:outline-none focus:ring-4 ${errors.email ? "focus:ring-red-500/10" : "focus:ring-indigo-500/10"} transition-all duration-200`}
              placeholder="name@example.com"
            />
            <div className="h-1">
              {errors.email && (
                <p className="text-red-400 text-xs font-medium leading-4">
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-400 text-xs font-medium tracking-wide">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password || errors.server)
                  setErrors((prev) => ({
                    ...prev,
                    password: undefined,
                    server: undefined,
                  }));
              }}
              className={`w-full bg-zinc-900/90 text-zinc-100 placeholder-zinc-600 rounded-lg px-3.5 py-2.5 text-sm
              border ${errors.password ? "border-red-500/50 focus:border-red-500" : "border-zinc-800 focus:border-indigo-500"}
              focus:outline-none focus:ring-4 ${errors.password ? "focus:ring-red-500/10" : "focus:ring-indigo-500/10"} transition-all duration-200`}
              placeholder="••••••••"
            />
            <div className="h-1">
              {errors.password && (
                <p className="text-red-400 text-xs font-medium leading-4">
                  {errors.password}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.98] transition-all duration-200 mt-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Signing in...</span>
              </div>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="text-zinc-500 text-xs text-center mt-6 tracking-wide">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors ml-1"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
