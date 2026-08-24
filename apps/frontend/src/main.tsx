import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "sonner";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <Toaster
      theme="dark"
      position="top-right"
      richColors
      toastOptions={{
        style: {
          background: "#27272a",
          color: "#f4f4f5",
          border: "1px solid #3f3f46",
          borderRadius: "12px",
          fontSize: "14px",
        },
      }}
    />
  </>
);