"use client";

import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";
import { makeQueryClient } from "@/lib/query/query-client";
import { FloatingNotificationBell } from "@/components/floating-notification-bell";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => makeQueryClient());

  return (
    <ThemeProvider attribute="class" forcedTheme="light" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
        <FloatingNotificationBell />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}


