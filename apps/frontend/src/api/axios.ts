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
  } catch {
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
  config.headers["X-Fingerprint"] = fingerprint;
  return config;
});

api.interceptors.request.use(async (config) => {
  const fingerprint = await getDeviceFingerprint();
  config.headers["X-Fingerprint"] = fingerprint;
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

const onRefreshFailed = () => {
  refreshSubscribers = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes("/auth/login") &&
      !original.url?.includes("/auth/register") &&
      !original.url?.includes("/auth/refresh") 
    ) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshSubscribers.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      isRefreshing = true;

      try {
        const { data } = await axiosBase.post("/auth/refresh");
        useAuthStore.getState().setAuth(data.accessToken, data.user);
        onRefreshed(data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshError) {
        onRefreshFailed();
        useAuthStore.getState().logout();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;