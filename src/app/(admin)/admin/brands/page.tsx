"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BrandForm } from "@/components/admin/brand-form";
import { Building2, Plus } from "lucide-react";
import { toast } from "sonner";

interface Brand {
  id: string;
  name: string;
  logoUrl: string | null;
  address: string | null;
  taxId: string | null;
  serviceChargePct: string | null;
  vatPct: string | null;
  createdAt: string;
}

export default function BrandsListPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchBrands = async () => {
    try {
      const res = await fetch("/api/brands");
      if (res.ok) {
        const data = await res.json();
        setBrands(data);
      }
    } catch {
      toast.error("Failed to fetch brands");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Brands</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            New Brand
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Brand</DialogTitle>
            </DialogHeader>
            <BrandForm
              onSuccess={() => {
                setDialogOpen(false);
                fetchBrands();
              }}
              onCancel={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading brands...</p>
      ) : brands.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Building2 className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">No brands yet. Create your first brand to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Link key={brand.id} href={`/admin/brands/${brand.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {brand.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={brand.logoUrl}
                        alt={brand.name}
                        className="h-10 w-10 rounded-lg border object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-gray-50">
                        <Building2 className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">{brand.name}</CardTitle>
                      <CardDescription>
                        {brand.address || "No address"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>SC: {brand.serviceChargePct}%</span>
                    <span>VAT: {brand.vatPct}%</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
