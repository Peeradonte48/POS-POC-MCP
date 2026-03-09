"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface HistoryOrder {
  id: string;
  orderNumber: number;
  orderType: "table" | "counter" | "takeaway";
  tableNumber: number | null;
  label: string;
  itemCount: number;
  total: number;
  completedAt: string;
}

interface OrderHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const thbFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function formatCompletionTime(completedAt: string): string {
  return new Date(completedAt).toLocaleTimeString("th-TH", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function OrderHistorySheet({ open, onOpenChange }: OrderHistorySheetProps) {
  const { data, isLoading } = useQuery<{ orders: HistoryOrder[] }>({
    queryKey: ["orderHistory"],
    queryFn: () => fetch("/api/orders/history").then((r) => r.json()),
    enabled: open,
    staleTime: 60 * 1000,
  });

  const orders = data?.orders ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[60vh] flex flex-col p-0">
        <SheetHeader className="px-4 pt-4 pb-3 border-b shrink-0">
          <SheetTitle className="text-base font-semibold">{"Today's Orders"}</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {isLoading
              ? "Loading..."
              : `${orders.length} order${orders.length === 1 ? "" : "s"} today`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col gap-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-3 border-b animate-pulse"
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="h-4 w-20 bg-muted rounded" />
                    <div className="h-3 w-14 bg-muted rounded" />
                  </div>
                  <div className="flex flex-col gap-1.5 items-end">
                    <div className="h-4 w-16 bg-muted rounded" />
                    <div className="h-3 w-10 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              No completed orders today
            </div>
          ) : (
            <div className="flex flex-col">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between px-4 py-3 border-b last:border-b-0"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-foreground">
                      #{order.orderNumber}
                    </span>
                    <span className="text-xs text-muted-foreground">{order.label}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 items-end">
                    <span className="text-sm font-medium text-foreground">
                      {thbFormatter.format(order.total)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {order.itemCount} item{order.itemCount === 1 ? "" : "s"} ·{" "}
                      {formatCompletionTime(order.completedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
