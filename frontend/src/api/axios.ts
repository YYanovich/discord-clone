import axios from "axios";
import { useAuthStore } from "../store/authStore";

export const axiosBase = axios.create({
  baseURL: "http:localhost:3000/api",
  withCredentials: true,
});

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});
api.interceptors.request.use((config) => {
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
    if (error.response?.status === 401 && !original._retry) {
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
