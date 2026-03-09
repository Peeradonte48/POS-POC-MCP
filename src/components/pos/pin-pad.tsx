"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Delete, X } from "lucide-react";

interface PinPadProps {
  onSubmit: (pin: string) => void;
  maxLength?: number;
  isLoading?: boolean;
}

export function PinPad({ onSubmit, maxLength = 6, isLoading }: PinPadProps) {
  const [pin, setPin] = useState("");

  const handleDigit = (digit: string) => {
    if (pin.length < maxLength) {
      const next = pin + digit;
      setPin(next);
      if (next.length === 4) {
        onSubmit(next);
      }
    }
  };

  const handleBackspace = () => setPin((prev) => prev.slice(0, -1));
  const handleClear = () => setPin("");

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  const btnClass =
    "h-16 w-16 sm:h-[72px] sm:w-[72px] md:h-20 md:w-20 rounded-2xl text-xl sm:text-2xl md:text-3xl font-semibold shadow-sm hover:shadow-md transition-all active:scale-95";
  const ghostBtnClass =
    "h-16 w-16 sm:h-[72px] sm:w-[72px] md:h-20 md:w-20 rounded-2xl text-muted-foreground";

  return (
    <div className="flex flex-col items-center gap-6 sm:gap-8">
      {/* PIN display dots */}
      <div className="flex gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full transition-all duration-200 ${
              i < pin.length
                ? "bg-primary scale-110"
                : "border-2 border-muted-foreground/30"
            }`}
          />
        ))}
      </div>

      {/* Number grid */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {digits.map((digit) => (
          <Button
            key={digit}
            variant="outline"
            className={btnClass}
            onClick={() => handleDigit(digit)}
            disabled={isLoading || pin.length >= maxLength}
          >
            {digit}
          </Button>
        ))}

        <Button
          variant="ghost"
          className={ghostBtnClass}
          onClick={handleClear}
          disabled={isLoading || pin.length === 0}
        >
          <X className="h-5 w-5" />
        </Button>

        <Button
          variant="outline"
          className={btnClass}
          onClick={() => handleDigit("0")}
          disabled={isLoading || pin.length >= maxLength}
        >
          0
        </Button>

        <Button
          variant="ghost"
          className={ghostBtnClass}
          onClick={handleBackspace}
          disabled={isLoading || pin.length === 0}
        >
          <Delete className="h-5 w-5" />
        </Button>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground animate-pulse">
          Signing in...
        </p>
      )}
    </div>
  );
}
