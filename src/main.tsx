import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initPWARecovery } from "./utils/pwaRecovery";

// Initialize PWA recovery before React mounts
// This catches chunk loading errors and auto-recovers
initPWARecovery();

createRoot(document.getElementById("root")!).render(<App />);
