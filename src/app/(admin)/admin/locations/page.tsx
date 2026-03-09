"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LocationForm } from "@/components/admin/location-form";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus } from "lucide-react";
import { toast } from "sonner";

interface Location {
  id: string;
  brandId: string;
  name: string;
  address: string | null;
  isActive: boolean | null;
}

interface Brand {
  id: string;
  name: string;
}

export default function LocationsListPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [locRes, brandRes] = await Promise.all([
        fetch("/api/locations"),
        fetch("/api/brands"),
      ]);
      if (locRes.ok) setLocations(await locRes.json());
      if (brandRes.ok) setBrands(await brandRes.json());
    } catch {
      toast.error("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getBrandName = (brandId: string) =>
    brands.find((b) => b.id === brandId)?.name ?? "Unknown";

  // Group locations by brand
  const groupedLocations = brands.map((brand) => ({
    brand,
    locations: locations.filter((l) => l.brandId === brand.id),
  })).filter((g) => g.locations.length > 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Locations</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            New Location
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Location</DialogTitle>
            </DialogHeader>
            <LocationForm
              brands={brands}
              onSuccess={() => {
                setDialogOpen(false);
                fetchData();
              }}
              onCancel={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading locations...</p>
      ) : locations.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <MapPin className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">
              No locations yet. Create your first location to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedLocations.map(({ brand, locations: locs }) => (
            <div key={brand.id}>
              <h2 className="mb-3 text-lg font-semibold">{brand.name}</h2>
              <div className="space-y-2">
                {locs.map((loc) => (
                  <Link
                    key={loc.id}
                    href={`/admin/locations/${loc.id}`}
                    className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-gray-50"
                  >
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="font-medium">{loc.name}</p>
                      <p className="text-sm text-gray-500">
                        {loc.address || "No address"} - {getBrandName(loc.brandId)}
                      </p>
                    </div>
                    <Badge
                      variant={loc.isActive ? "default" : "secondary"}
                    >
                      {loc.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
