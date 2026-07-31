import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { axiosBase } from "./api/axios";
import { useAuthStore } from "./store/authStore";
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="bottom-center"
      toastOptions={{
        style: {
          background: "#27272a",
          color: "#f4f4f5",
          border: "1px solid #3f3f46",
          borderRadius: "12px",
          fontSize: "14px",
        },
        success: { iconTheme: { primary: "#6366f1", secondary: "#fff" } },
        error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
      }}
    />
  </React.StrictMode>,
);

axiosBase
  .post("/auth/refresh")
  .then(({ data }) => {
    useAuthStore.getState().setAuth(data.accessToken, data.user);
  })
  .catch(() => {
    useAuthStore.getState().logout();
  });
