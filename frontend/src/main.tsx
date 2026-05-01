import "./index.css";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { queryClient } from "./lib/queryClient";
import { ToastProvider } from "./components/ui/Toast";
import { router } from "./router";

async function main() {
  // Mock API is opt-in only. Normal dev should talk to the real Go backend.
  if (!import.meta.env.PROD && import.meta.env.VITE_MOCK_API === "true") {
    const { installMockApi } = await import("./lib/mock");
    installMockApi();
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}

main();
