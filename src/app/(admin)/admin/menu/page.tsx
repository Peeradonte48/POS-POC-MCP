"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SyncStatus } from "@/components/admin/sync-status";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RefreshCw, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";

interface Brand {
  id: string;
  name: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  isActive: boolean | null;
}

interface MenuCategory {
  id: string;
  name: string;
  sortOrder: number | null;
  items: MenuItem[];
}

interface SyncLog {
  id: string;
  brandId: string;
  status: string;
  itemsSynced: number | null;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

export default function MenuPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await fetch("/api/brands");
        if (res.ok) {
          const data = await res.json();
          setBrands(data);
          if (data.length > 0) {
            setSelectedBrandId(data[0].id);
          }
        }
      } catch {
        toast.error("Failed to fetch brands");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBrands();
  }, []);

  useEffect(() => {
    if (!selectedBrandId) return;

    const fetchMenu = async () => {
      try {
        const [menuRes, syncRes] = await Promise.all([
          fetch(`/api/menu?brandId=${selectedBrandId}`),
          fetch(`/api/sync?brandId=${selectedBrandId}`),
        ]);

        if (menuRes.ok) {
          const menuData = await menuRes.json();
          setCategories(menuData.categories ?? menuData);
        }
        if (syncRes.ok) {
          const syncData = await syncRes.json();
          setSyncLogs(syncData);
        }
      } catch {
        toast.error("Failed to fetch menu data");
      }
    };
    fetchMenu();
  }, [selectedBrandId]);

  const handleSync = async () => {
    if (!selectedBrandId) return;
    setIsSyncing(true);

    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: selectedBrandId }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          toast.success(
            `Synced ${result.itemsSynced} items and ${result.categoriesSynced} categories`
          );
        } else {
          toast.error("Sync failed: " + (result.errors?.[0] ?? "Unknown error"));
        }
      } else {
        toast.error("Sync request failed");
      }

      // Refresh menu and sync logs
      const [menuRes, syncRes] = await Promise.all([
        fetch(`/api/menu?brandId=${selectedBrandId}`),
        fetch(`/api/sync?brandId=${selectedBrandId}`),
      ]);
      if (menuRes.ok) {
        const data = await menuRes.json();
        setCategories(data.categories ?? data);
      }
      if (syncRes.ok) setSyncLogs(await syncRes.json());
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading...</p>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Menu</h1>
        <div className="flex items-center gap-3">
          <select
            value={selectedBrandId}
            onChange={(e) => setSelectedBrandId(e.target.value)}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <Button onClick={handleSync} disabled={isSyncing}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
            />
            {isSyncing ? "Syncing..." : "Sync Menu"}
          </Button>
        </div>
      </div>

      {/* Sync Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
        </CardHeader>
        <CardContent>
          <SyncStatus syncLogs={syncLogs} isSyncing={isSyncing} />
        </CardContent>
      </Card>

      {/* Menu Categories & Items (Read-only) */}
      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <UtensilsCrossed className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">
              No menu items yet. Click &quot;Sync Menu&quot; to import from ERP.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Accordion multiple>
          {categories.map((category) => (
            <AccordionItem key={category.id}>
              <AccordionTrigger className="text-base font-semibold">
                <div className="flex items-center gap-2">
                  {category.name}
                  <Badge variant="secondary" className="ml-2">
                    {category.items.length} items
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pl-4">
                  {category.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-12 w-12 rounded-lg border object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-gray-50">
                          <UtensilsCrossed className="h-5 w-5 text-gray-300" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        {item.description && (
                          <p className="text-sm text-gray-500">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {parseFloat(item.price).toFixed(2)}
                        </p>
                        {!item.isActive && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
