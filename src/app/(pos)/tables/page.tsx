"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Users, LogOut, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TableInfo {
  number: number;
  label: string;
}

export default function TablesPage() {
  const router = useRouter();
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [locationName, setLocationName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tables")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => {
        setTables(data.tables ?? []);
        setLocationName(data.locationName ?? "");
      })
      .catch(() => toast.error("Failed to load tables"))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSelectTable = (table: TableInfo) => {
    router.push(`/menu?table=${table.number}`);
  };

  const handleTakeaway = () => {
    router.push("/menu?table=takeaway");
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

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
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
          {tables.map((table) => (
            <button
              key={table.number}
              onClick={() => handleSelectTable(table)}
              className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border bg-card p-3 sm:p-4 aspect-square cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg active:scale-[0.96]"
            >
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              <span className="text-base font-bold text-foreground sm:text-lg">
                {table.number}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile takeaway button */}
      <div className="border-t p-3 sm:hidden">
        <Button
          variant="outline"
          className="w-full h-11 text-sm font-medium rounded-xl cursor-pointer gap-2"
          onClick={handleTakeaway}
        >
          <PackageOpen className="h-4 w-4" />
          Takeaway Order
        </Button>
      </div>
    </div>
  );
}
