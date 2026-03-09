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
      setPin((prev) => prev + digit);
    }
  };

  const handleBackspace = () => setPin((prev) => prev.slice(0, -1));
  const handleClear = () => setPin("");
  const handleSubmit = () => {
    if (pin.length >= 4) {
      onSubmit(pin);
    }
  };

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className="flex flex-col items-center gap-6">
      {/* PIN display dots */}
      <div className="flex gap-3">
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className={`h-4 w-4 rounded-full border-2 transition-colors ${
              i < pin.length
                ? "bg-primary border-primary"
                : "border-muted-foreground/40"
            }`}
          />
        ))}
      </div>

      {/* Number grid */}
      <div className="grid grid-cols-3 gap-3">
        {digits.map((digit) => (
          <Button
            key={digit}
            variant="outline"
            className="h-16 w-16 text-2xl font-medium"
            onClick={() => handleDigit(digit)}
            disabled={isLoading || pin.length >= maxLength}
          >
            {digit}
          </Button>
        ))}

        {/* Bottom row: Clear, 0, Backspace */}
        <Button
          variant="ghost"
          className="h-16 w-16"
          onClick={handleClear}
          disabled={isLoading || pin.length === 0}
        >
          <X className="h-5 w-5" />
        </Button>

        <Button
          variant="outline"
          className="h-16 w-16 text-2xl font-medium"
          onClick={() => handleDigit("0")}
          disabled={isLoading || pin.length >= maxLength}
        >
          0
        </Button>

        <Button
          variant="ghost"
          className="h-16 w-16"
          onClick={handleBackspace}
          disabled={isLoading || pin.length === 0}
        >
          <Delete className="h-5 w-5" />
        </Button>
      </div>

      {/* Enter button */}
      <Button
        className="w-full max-w-[224px] h-12 text-lg"
        onClick={handleSubmit}
        disabled={pin.length < 4 || isLoading}
      >
        {isLoading ? "Signing in..." : "Enter"}
      </Button>
    </div>
  );
}
