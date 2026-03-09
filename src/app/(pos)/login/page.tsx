"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PinPad } from "@/components/pos/pin-pad";
import { toast } from "sonner";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  // Terminal info can come from query params or be configured
  const terminalId = searchParams.get("terminalId") ?? "";
  const brandName = searchParams.get("brandName") ?? "A RAMEN";
  const locationName = searchParams.get("locationName") ?? "POS Terminal";

  const handlePinSubmit = async (pin: string) => {
    if (!terminalId) {
      toast.error("No terminal configured. Please contact your administrator.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/pin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, terminalId }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Invalid PIN. Please try again.");
        return;
      }

      router.push("/menu");
    } catch {
      toast.error("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-8">
        {/* Brand identity */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">{brandName}</h1>
          <p className="text-muted-foreground">{locationName}</p>
        </div>

        {/* PIN entry */}
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">Enter your PIN to sign in</p>
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
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
