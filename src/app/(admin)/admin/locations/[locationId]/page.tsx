"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { LocationForm } from "@/components/admin/location-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface LocationData {
  id: string;
  brandId: string;
  name: string;
  address: string | null;
  settings: {
    printerConfig?: { ip: string; port: number };
    tableCount?: number;
  } | null;
}

export default function LocationDetailPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = use(params);
  const router = useRouter();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await fetch(`/api/locations/${locationId}`);
        if (res.ok) {
          setLocation(await res.json());
        } else {
          toast.error("Location not found");
          router.push("/admin/locations");
        }
      } catch {
        toast.error("Failed to fetch location");
      } finally {
        setIsLoading(false);
      }
    };
    fetchLocation();
  }, [locationId, router]);

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading location...</p>;
  }

  if (!location) return null;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{location.name}</h1>
          <p className="text-sm text-gray-500">Location Settings</p>
        </div>
      </div>
      <div className="max-w-lg">
        <LocationForm
          location={location}
          brands={[]}
          onSuccess={() => {
            toast.success("Location updated");
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}
