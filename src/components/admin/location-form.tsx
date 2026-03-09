"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface LocationFormProps {
  location?: {
    id: string;
    brandId: string;
    name: string;
    address: string | null;
    settings: { printerConfig?: { ip: string; port: number }; tableCount?: number } | null;
  };
  brands: { id: string; name: string }[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function LocationForm({
  location,
  brands,
  onSuccess,
  onCancel,
}: LocationFormProps) {
  const isEditing = !!location;
  const [isLoading, setIsLoading] = useState(false);
  const [brandId, setBrandId] = useState(location?.brandId ?? (brands[0]?.id ?? ""));
  const [name, setName] = useState(location?.name ?? "");
  const [address, setAddress] = useState(location?.address ?? "");
  const [printerIp, setPrinterIp] = useState(
    location?.settings?.printerConfig?.ip ?? ""
  );
  const [printerPort, setPrinterPort] = useState(
    location?.settings?.printerConfig?.port?.toString() ?? "9100"
  );
  const [tableCount, setTableCount] = useState(
    location?.settings?.tableCount?.toString() ?? ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const settings: Record<string, unknown> = {};
    if (printerIp) {
      settings.printerConfig = {
        ip: printerIp,
        port: parseInt(printerPort) || 9100,
      };
    }
    if (tableCount) {
      settings.tableCount = parseInt(tableCount) || 0;
    }

    try {
      const url = isEditing
        ? `/api/locations/${location.id}`
        : "/api/locations";
      const method = isEditing ? "PUT" : "POST";

      const body: Record<string, unknown> = {
        name,
        address: address || null,
        settings: Object.keys(settings).length > 0 ? settings : null,
      };
      if (!isEditing) {
        body.brandId = brandId;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save location");
        return;
      }

      toast.success(isEditing ? "Location updated" : "Location created");
      onSuccess?.();
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isEditing && (
        <div className="space-y-2">
          <Label htmlFor="brandId">Brand</Label>
          <select
            id="brandId"
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            required
          >
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="loc-name">Location Name *</Label>
        <Input
          id="loc-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. Central World Branch"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="loc-address">Address</Label>
        <Textarea
          id="loc-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Full address"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Printer Settings</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="printer-ip" className="text-xs text-gray-500">
              IP Address
            </Label>
            <Input
              id="printer-ip"
              value={printerIp}
              onChange={(e) => setPrinterIp(e.target.value)}
              placeholder="192.168.1.100"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="printer-port" className="text-xs text-gray-500">
              Port
            </Label>
            <Input
              id="printer-port"
              type="number"
              value={printerPort}
              onChange={(e) => setPrinterPort(e.target.value)}
              placeholder="9100"
            />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="tableCount">Number of Tables</Label>
        <Input
          id="tableCount"
          type="number"
          value={tableCount}
          onChange={(e) => setTableCount(e.target.value)}
          placeholder="20"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? "Saving..."
            : isEditing
              ? "Update Location"
              : "Create Location"}
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
