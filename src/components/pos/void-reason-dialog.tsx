"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PinPad } from "@/components/pos/pin-pad";
import { useVoidItem, useVoidOrder } from "@/hooks/use-order";
import type { VoidReason } from "@/lib/void-schemas";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface VoidReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "item" | "order";
  orderId: string;
  itemId?: string; // required when mode="item"
  onSuccess: () => void;
}

// ---------------------------------------------------------------------------
// Reason label map
// ---------------------------------------------------------------------------

const REASON_OPTIONS: Array<{ value: VoidReason; label: string }> = [
  { value: "customer_changed_mind", label: "Customer Changed Mind" },
  { value: "wrong_item", label: "Wrong Item" },
  { value: "food_quality", label: "Food Quality" },
  { value: "staff_error", label: "Staff Error" },
];

type Step = "reason" | "pin" | "confirming";

// ---------------------------------------------------------------------------
// VoidReasonDialog
// ---------------------------------------------------------------------------

export function VoidReasonDialog({
  open,
  onOpenChange,
  mode,
  orderId,
  itemId,
  onSuccess,
}: VoidReasonDialogProps) {
  const [step, setStep] = useState<Step>("reason");
  const [selectedReason, setSelectedReason] = useState<VoidReason | null>(null);
  const [note, setNote] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [authorizedByUserId, setAuthorizedByUserId] = useState<string | null>(null);

  const voidItem = useVoidItem();
  const voidOrder = useVoidOrder();

  // Reset state when dialog closes
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setStep("reason");
      setSelectedReason(null);
      setNote("");
      setPinError(null);
      setIsVerifyingPin(false);
      setAuthorizedByUserId(null);
    }
    onOpenChange(nextOpen);
  };

  // Handle PIN submission (auto-submitted on 4 digits by PinPad)
  const handlePinSubmit = async (pin: string) => {
    setIsVerifyingPin(true);
    setPinError(null);

    try {
      const res = await fetch("/api/auth/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, requiredRole: "manager" }),
      });

      if (!res.ok) {
        setPinError("PIN verification failed. Try again.");
        setIsVerifyingPin(false);
        return;
      }

      const data = (await res.json()) as { valid: boolean; userId: string | null };

      if (!data.valid || !data.userId) {
        setPinError("Invalid PIN. Try again.");
        setIsVerifyingPin(false);
        return;
      }

      // PIN valid — move to confirming step
      setAuthorizedByUserId(data.userId);
      setIsVerifyingPin(false);
      setStep("confirming");

      // Immediately trigger the void
      await handleConfirm(data.userId);
    } catch {
      setPinError("Network error. Try again.");
      setIsVerifyingPin(false);
    }
  };

  const handleConfirm = async (userId: string) => {
    if (!selectedReason) return;

    try {
      if (mode === "item" && itemId) {
        await voidItem.mutateAsync({
          orderId,
          itemId,
          reason: selectedReason,
          note: note || undefined,
          authorizedByUserId: userId,
        });
      } else if (mode === "order") {
        await voidOrder.mutateAsync({
          orderId,
          reason: selectedReason,
          note: note || undefined,
          authorizedByUserId: userId,
        });
      }

      handleOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Failed to void. Please try again.");
      setStep("reason");
    }
  };

  const dialogTitle =
    step === "reason"
      ? mode === "item"
        ? "Void Item"
        : "Void Order"
      : step === "pin"
        ? "Enter Manager PIN"
        : "Processing...";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        {/* Step 1: Reason selection */}
        {step === "reason" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {REASON_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={selectedReason === opt.value ? "default" : "outline"}
                  className="h-auto py-3 text-sm leading-tight cursor-pointer"
                  onClick={() => setSelectedReason(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            <Textarea
              placeholder="Optional note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="resize-none"
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 cursor-pointer"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 cursor-pointer"
                disabled={!selectedReason}
                onClick={() => setStep("pin")}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Manager PIN */}
        {step === "pin" && (
          <div className="space-y-4">
            {pinError && (
              <p className="text-sm text-destructive text-center">{pinError}</p>
            )}
            <PinPad onSubmit={handlePinSubmit} isLoading={isVerifyingPin} />
            <Button
              variant="ghost"
              className="w-full cursor-pointer"
              onClick={() => setStep("reason")}
              disabled={isVerifyingPin}
            >
              Back
            </Button>
          </div>
        )}

        {/* Step 3: Confirming (brief loading state) */}
        {step === "confirming" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <p className="text-sm text-muted-foreground animate-pulse">
              Processing void...
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
