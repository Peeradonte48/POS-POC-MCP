"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut, PackageOpen, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderHistorySheet } from "@/components/pos/order-history-sheet";

interface TableInfo {
  number: number;
  label: string;
  status: "free" | "occupied" | "needs_attention";
  orderId: string | null;
  orderTotal: number | null;
  openedAt: string | null;
}

interface TablesApiResponse {
  tables: TableInfo[];
  locationName: string;
}

function getElapsedMinutes(openedAt: string): string {
  const elapsed = Math.floor((Date.now() - new Date(openedAt).getTime()) / 60000);
  if (elapsed < 1) return "< 1 min";
  if (elapsed < 60) return `${elapsed} min`;
  const hours = Math.floor(elapsed / 60);
  const mins = elapsed % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

const thbFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export default function TablesPage() {
  const router = useRouter();
  const [historyOpen, setHistoryOpen] = useState(false);

  const { data, isLoading, isError } = useQuery<TablesApiResponse>({
    queryKey: ["tables"],
    queryFn: () =>
      fetch("/api/tables").then((r) => {
        if (!r.ok) throw new Error("Failed to load tables");
        return r.json();
      }),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
  });

  useEffect(() => {
    if (isError) toast.error("Failed to load tables");
  }, [isError]);

  const tables = data?.tables ?? [];
  const locationName = data?.locationName ?? "";

  const handleSelectTable = (table: TableInfo) => {
    if (table.status !== "free" && table.orderId) {
      router.push(`/menu?table=${table.number}&orderId=${table.orderId}`);
    } else {
      router.push(`/menu?table=${table.number}`);
    }
  };

  const handleTakeaway = () => {
    router.push("/menu?type=takeaway");
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const tableCardClasses = (status: TableInfo["status"]) => {
    if (status === "occupied") {
      return "bg-amber-50 border-amber-300 text-amber-800 hover:border-amber-400 hover:shadow-amber-100";
    }
    if (status === "needs_attention") {
      return "bg-red-50 border-red-300 text-red-800 hover:border-red-400 hover:shadow-red-100";
    }
    return "bg-green-50 border-green-300 text-green-800 hover:border-green-400 hover:shadow-green-100";
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-3 sm:px-6 sm:py-4">
        <div>
          <h1 className="text-lg font-bold text-foreground sm:text-xl">
            Select Table
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {locationName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 cursor-pointer hidden sm:flex"
            onClick={() => setHistoryOpen(true)}
          >
            <History className="h-4 w-4" />
            Order History
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 cursor-pointer hidden sm:flex"
            onClick={handleTakeaway}
          >
            <PackageOpen className="h-4 w-4" />
            Takeaway
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Table grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-2xl border bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
            {tables.map((table) => (
              <button
                key={table.number}
                onClick={() => handleSelectTable(table)}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl border p-2 sm:p-3 aspect-square cursor-pointer transition-all hover:shadow-lg active:scale-[0.96] ${tableCardClasses(table.status)}`}
              >
                <span className="text-base font-bold sm:text-lg leading-tight">
                  {table.number}
                </span>
                {table.status !== "free" && table.orderTotal !== null && (
                  <span className="text-xs font-medium leading-tight">
                    {thbFormatter.format(table.orderTotal)}
                  </span>
                )}
                {table.status !== "free" && table.openedAt && (
                  <span className="text-[10px] leading-tight opacity-80">
                    {getElapsedMinutes(table.openedAt)}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile bottom bar */}
      <div className="border-t p-3 sm:hidden flex gap-2">
        <Button
          variant="outline"
          className="flex-1 h-11 text-sm font-medium rounded-xl cursor-pointer gap-2"
          onClick={() => setHistoryOpen(true)}
        >
          <History className="h-4 w-4" />
          Order History
        </Button>
        <Button
          variant="outline"
          className="flex-1 h-11 text-sm font-medium rounded-xl cursor-pointer gap-2"
          onClick={handleTakeaway}
        >
          <PackageOpen className="h-4 w-4" />
          Takeaway
        </Button>
      </div>

      <OrderHistorySheet open={historyOpen} onOpenChange={setHistoryOpen} />
    </div>
  );
}
