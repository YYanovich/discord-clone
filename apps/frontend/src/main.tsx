import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { axiosBase } from "./api/axios";
import { useAuthStore } from "./store/authStore";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
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
