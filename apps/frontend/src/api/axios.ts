import axios from "axios";
import { useAuthStore } from "../store/authStore";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

let cachedFingerprint: string | null = null;

async function getDeviceFingerprint(): Promise<string> {
  if (cachedFingerprint) return cachedFingerprint;
  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    cachedFingerprint = result.visitorId;
    return cachedFingerprint;
  } catch (error) {
    console.error("Failed to generate device fingerprint:", error);
    return "fallback_device_id";
  }
}

export const axiosBase = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});

axiosBase.interceptors.request.use(async (config) => {
  const fingerprint = await getDeviceFingerprint();
  if (config.headers) {
    config.headers["X-Fingerprint"] = fingerprint;
  }
  return config;
});

api.interceptors.request.use(async (config) => {
  const fingerprint = await getDeviceFingerprint();
  if (config.headers) {
    config.headers["X-Fingerprint"] = fingerprint;
  }

  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes("/auth/login") &&
      !original.url?.includes("/auth/register")
    ) {
      original._retry = true;
      try {
        const { data } = await axiosBase.post("/auth/refresh");
        const currentUser = useAuthStore.getState().user!;
        useAuthStore.getState().setAuth(data.accessToken, currentUser);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
