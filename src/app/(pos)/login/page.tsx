"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PinPad } from "@/components/pos/pin-pad";
import { toast } from "sonner";

interface Terminal {
  id: string;
  name: string;
  brandName: string;
  locationName: string;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [selectedTerminal, setSelectedTerminal] = useState<Terminal | null>(
    null
  );
  const [loadingTerminals, setLoadingTerminals] = useState(true);

  const terminalIdFromParams = searchParams.get("terminalId");

  useEffect(() => {
    fetch("/api/terminals")
      .then((res) => res.json())
      .then((data) => {
        setTerminals(data.terminals ?? []);
        if (terminalIdFromParams) {
          const found = (data.terminals ?? []).find(
            (t: Terminal) => t.id === terminalIdFromParams
          );
          if (found) setSelectedTerminal(found);
        } else if ((data.terminals ?? []).length === 1) {
          setSelectedTerminal(data.terminals[0]);
        }
      })
      .catch(() => toast.error("Failed to load terminals"))
      .finally(() => setLoadingTerminals(false));
  }, [terminalIdFromParams]);

  const handlePinSubmit = async (pin: string) => {
    if (!selectedTerminal) {
      toast.error("Please select a terminal first.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/pin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, terminalId: selectedTerminal.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Invalid PIN. Please try again.");
        return;
      }

      router.push("/tables");
    } catch {
      toast.error("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingTerminals) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-background px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Terminal selection screen
  if (!selectedTerminal) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-8 w-full max-w-md">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Select Terminal
            </h1>
            <p className="text-muted-foreground">
              Choose your terminal to begin
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            {terminals.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTerminal(t)}
                className="rounded-xl border bg-card p-5 text-left cursor-pointer hover:border-primary/50 hover:shadow-md transition-all active:scale-[0.98]"
              >
                <p className="font-semibold text-card-foreground">
                  {t.brandName}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t.locationName} — {t.name}
                </p>
              </button>
            ))}
            {terminals.length === 0 && (
              <p className="text-center text-muted-foreground">
                No terminals found. Contact your administrator.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-10">
        {/* Brand identity */}
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {selectedTerminal.brandName}
          </h1>
          <p className="text-muted-foreground">
            {selectedTerminal.locationName}
          </p>
          {terminals.length > 1 && (
            <button
              onClick={() => setSelectedTerminal(null)}
              className="mt-2 text-xs text-primary/70 hover:text-primary transition-colors cursor-pointer"
            >
              Change terminal
            </button>
          )}
        </div>

        {/* PIN entry */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm font-medium text-muted-foreground">
            Enter your PIN
          </p>
          <PinPad onSubmit={handlePinSubmit} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
