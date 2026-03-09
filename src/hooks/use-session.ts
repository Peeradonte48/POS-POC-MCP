"use client";

import { useQuery } from "@tanstack/react-query";
import type { SessionPayload } from "@/types/auth";

interface UseSessionReturn {
  user: SessionPayload | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
}

export function useSession(): UseSessionReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: ["session"],
    queryFn: async (): Promise<SessionPayload> => {
      const res = await fetch("/api/auth/verify");
      if (!res.ok) {
        throw new Error("Not authenticated");
      }
      const json = await res.json();
      return json.user;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    user: data ?? null,
    isLoading,
    isAuthenticated: !!data,
    error: error as Error | null,
  };
}
