"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import { MapPin } from "lucide-react";

interface Location {
  id: string;
  name: string;
  address: string | null;
  isActive: boolean | null;
}

interface BrandData {
  id: string;
  name: string;
  logoUrl: string | null;
  address: string | null;
  taxId: string | null;
  serviceChargePct: string | null;
  vatPct: string | null;
  locations: Location[];
}

export function BrandSettingsTabs({ brand }: { brand: BrandData }) {
  const [generalData, setGeneralData] = useState({
    name: brand.name,
    logoUrl: brand.logoUrl ?? "",
    address: brand.address ?? "",
    taxId: brand.taxId ?? "",
  });

  const [billingData, setBillingData] = useState({
    serviceChargePct: brand.serviceChargePct ?? "10.00",
    vatPct: brand.vatPct ?? "7.00",
  });

  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [isSavingBilling, setIsSavingBilling] = useState(false);

  const saveGeneral = async () => {
    setIsSavingGeneral(true);
    try {
      const res = await fetch(`/api/brands/${brand.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: generalData.name,
          logoUrl: generalData.logoUrl || null,
          address: generalData.address || null,
          taxId: generalData.taxId || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save");
        return;
      }
      toast.success("General settings saved");
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSavingGeneral(false);
    }
  };

  const saveBilling = async () => {
    setIsSavingBilling(true);
    try {
      const res = await fetch(`/api/brands/${brand.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceChargePct: billingData.serviceChargePct,
          vatPct: billingData.vatPct,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save");
        return;
      }
      toast.success("Billing settings saved");
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSavingBilling(false);
    }
  };

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
        <TabsTrigger value="locations">Locations</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="mt-6 space-y-4">
        <div className="max-w-lg space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gen-name">Brand Name</Label>
            <Input
              id="gen-name"
              value={generalData.name}
              onChange={(e) =>
                setGeneralData({ ...generalData, name: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gen-logo">Logo URL</Label>
            <Input
              id="gen-logo"
              value={generalData.logoUrl}
              onChange={(e) =>
                setGeneralData({ ...generalData, logoUrl: e.target.value })
              }
              placeholder="https://example.com/logo.png"
            />
            {generalData.logoUrl && (
              <div className="mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={generalData.logoUrl}
                  alt="Brand logo preview"
                  className="h-16 w-16 rounded-lg border object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="gen-address">Address</Label>
            <Textarea
              id="gen-address"
              value={generalData.address}
              onChange={(e) =>
                setGeneralData({ ...generalData, address: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gen-tax">Tax ID</Label>
            <Input
              id="gen-tax"
              value={generalData.taxId}
              onChange={(e) =>
                setGeneralData({ ...generalData, taxId: e.target.value })
              }
            />
          </div>
          <Button onClick={saveGeneral} disabled={isSavingGeneral}>
            {isSavingGeneral ? "Saving..." : "Save General Settings"}
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="billing" className="mt-6 space-y-4">
        <div className="max-w-lg space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bill-sc">Service Charge %</Label>
            <Input
              id="bill-sc"
              type="number"
              step="0.01"
              value={billingData.serviceChargePct}
              onChange={(e) =>
                setBillingData({
                  ...billingData,
                  serviceChargePct: e.target.value,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bill-vat">VAT %</Label>
            <Input
              id="bill-vat"
              type="number"
              step="0.01"
              value={billingData.vatPct}
              onChange={(e) =>
                setBillingData({ ...billingData, vatPct: e.target.value })
              }
            />
          </div>
          <Button onClick={saveBilling} disabled={isSavingBilling}>
            {isSavingBilling ? "Saving..." : "Save Billing Settings"}
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="locations" className="mt-6">
        <div className="space-y-3">
          {brand.locations.length === 0 ? (
            <p className="text-sm text-gray-500">
              No locations yet.{" "}
              <Link href="/admin/locations" className="text-blue-600 underline">
                Create one
              </Link>
            </p>
          ) : (
            brand.locations.map((loc) => (
              <Link
                key={loc.id}
                href={`/admin/locations/${loc.id}`}
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50"
              >
                <MapPin className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <p className="font-medium">{loc.name}</p>
                  {loc.address && (
                    <p className="text-sm text-gray-500">{loc.address}</p>
                  )}
                </div>
                <Badge variant={loc.isActive ? "default" : "secondary"}>
                  {loc.isActive ? "Active" : "Inactive"}
                </Badge>
              </Link>
            ))
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
