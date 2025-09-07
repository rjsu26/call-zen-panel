import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Ensure React is available globally for components that might need it
(window as any).React = React;

createRoot(document.getElementById("root")!).render(<App />);
