import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./firebase.js";
import "./index.css";
import "./styles/responsive.css";
import AdminApp from "./AdminApp.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AdminApp />
  </StrictMode>,
);
