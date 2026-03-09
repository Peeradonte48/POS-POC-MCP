"use client";

import { useSession } from "./use-session";

interface TerminalContext {
  brandId: string | null;
  locationId: string | null;
  terminalId: string | null;
  isLoading: boolean;
}

export function useTerminal(): TerminalContext {
  const { user, isLoading } = useSession();

  return {
    brandId: user?.brandId ?? null,
    locationId: user?.locationId ?? null,
    terminalId: user?.terminalId ?? null,
    isLoading,
  };
}
