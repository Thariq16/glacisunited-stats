import React from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

function RootApp() {
  return (
    <React.StrictMode>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <App />
      </ThemeProvider>
    </React.StrictMode>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<RootApp />);