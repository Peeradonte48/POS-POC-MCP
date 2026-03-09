"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface BrandFormProps {
  brand?: {
    id: string;
    name: string;
    logoUrl: string | null;
    address: string | null;
    taxId: string | null;
    serviceChargePct: string | null;
    vatPct: string | null;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BrandForm({ brand, onSuccess, onCancel }: BrandFormProps) {
  const isEditing = !!brand;
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(brand?.name ?? "");
  const [logoUrl, setLogoUrl] = useState(brand?.logoUrl ?? "");
  const [address, setAddress] = useState(brand?.address ?? "");
  const [taxId, setTaxId] = useState(brand?.taxId ?? "");
  const [serviceChargePct, setServiceChargePct] = useState(
    brand?.serviceChargePct ?? "10.00"
  );
  const [vatPct, setVatPct] = useState(brand?.vatPct ?? "7.00");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = isEditing ? `/api/brands/${brand.id}` : "/api/brands";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          logoUrl: logoUrl || null,
          address: address || null,
          taxId: taxId || null,
          serviceChargePct,
          vatPct,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save brand");
        return;
      }

      toast.success(isEditing ? "Brand updated" : "Brand created");
      onSuccess?.();
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Brand Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. A RAMEN"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="logoUrl">Logo URL</Label>
        <Input
          id="logoUrl"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://example.com/logo.png"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="123 Main Street, Bangkok"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="taxId">Tax ID</Label>
          <Input
            id="taxId"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            placeholder="1234567890"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="serviceChargePct">Service Charge %</Label>
          <Input
            id="serviceChargePct"
            type="number"
            step="0.01"
            value={serviceChargePct}
            onChange={(e) => setServiceChargePct(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="vatPct">VAT %</Label>
        <Input
          id="vatPct"
          type="number"
          step="0.01"
          value={vatPct}
          onChange={(e) => setVatPct(e.target.value)}
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : isEditing ? "Update Brand" : "Create Brand"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
