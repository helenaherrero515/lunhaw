"use client";

import React, { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/auth/auth-service";
import { useLunhawStore } from "@/lib/store/use-lunhaw-store";

function AuthListener() {
  useEffect(() => {
    // 1. Check URL hash for Supabase auth callbacks (#type=recovery, #type=signup, etc.)
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash.includes("type=recovery") || hash.includes("reset-password")) {
        useLunhawStore.getState().openAuth("update_password");
      }
    }

    // 2. Listen to Supabase Auth state events
    const client = getSupabaseClient();
    if (!client) return;

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        useLunhawStore.getState().openAuth("update_password");
      } else if (event === "SIGNED_IN" && session?.user) {
        useLunhawStore.getState().setCurrentUser({
          id: session.user.id,
          email: session.user.email ?? "",
          name: session.user.user_metadata?.full_name,
        });
      } else if (event === "SIGNED_OUT") {
        useLunhawStore.getState().setCurrentUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthListener />
      {children}
    </QueryClientProvider>
  );
}
