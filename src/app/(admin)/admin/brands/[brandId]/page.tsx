"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { BrandSettingsTabs } from "@/components/admin/brand-settings-tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

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

export default function BrandDetailPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = use(params);
  const router = useRouter();
  const [brand, setBrand] = useState<BrandData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        const res = await fetch(`/api/brands/${brandId}`);
        if (res.ok) {
          const data = await res.json();
          setBrand(data);
        } else {
          toast.error("Brand not found");
          router.push("/admin/brands");
        }
      } catch {
        toast.error("Failed to fetch brand");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBrand();
  }, [brandId, router]);

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading brand...</p>;
  }

  if (!brand) {
    return null;
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{brand.name}</h1>
          <p className="text-sm text-gray-500">Brand Settings</p>
        </div>
      </div>
      <BrandSettingsTabs brand={brand} />
    </div>
  );
}
