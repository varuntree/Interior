"use client";

import { ReactNode } from "react";
import { Toaster } from "sonner";
import NextTopLoader from "nextjs-toploader";
import config from "@/config";
import { ThemeProvider } from "@/components/ThemeProvider";

// This component wraps the app with client-side providers and components
// It includes toast notifications, loading bar, and theme provider
const ClientLayout = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {/* Loading bar for page transitions */}
      <NextTopLoader
        color={config.colors.main}
        initialPosition={0.08}
        crawlSpeed={200}
        height={3}
        crawl={true}
        showSpinner={true}
        easing="ease"
        speed={200}
        shadow={`0 0 10px ${config.colors.main},0 0 5px ${config.colors.main}`}
      />

      {/* Toast notifications */}
      <Toaster richColors />

      {/* Main app content */}
      {children}
    </ThemeProvider>
  );
};

export default ClientLayout;
