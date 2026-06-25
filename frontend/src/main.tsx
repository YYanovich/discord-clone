import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { axiosBase } from "./api/axios";
import { useAuthStore } from "./store/authStore";

async function bootstrap() {
  try {
    const { data } = await axiosBase.post("/auth/refresh");
    useAuthStore.getState().setAuth(data.accessToken, data.user);
  } catch {
    useAuthStore.getState().setLoading(false);
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

bootstrap();
