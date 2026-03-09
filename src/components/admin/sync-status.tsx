"use client";

import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

interface SyncLog {
  id: string;
  brandId: string;
  status: string;
  itemsSynced: number | null;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

interface SyncStatusProps {
  syncLogs: SyncLog[];
  isSyncing?: boolean;
}

export function SyncStatus({ syncLogs, isSyncing }: SyncStatusProps) {
  const latestLog = syncLogs[0];

  if (isSyncing) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <RefreshCw className="h-4 w-4 animate-spin text-yellow-500" />
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
          Syncing...
        </Badge>
      </div>
    );
  }

  if (!latestLog) {
    return (
      <p className="text-sm text-gray-500">No sync history. Click &quot;Sync Menu&quot; to import menu data from ERP.</p>
    );
  }

  const statusBadge = () => {
    switch (latestLog.status) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-100 text-green-700">
            In sync
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive">
            Sync failed
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
            Syncing...
          </Badge>
        );
      default:
        return <Badge variant="secondary">{latestLog.status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {statusBadge()}
        {latestLog.itemsSynced !== null && (
          <span className="text-sm text-gray-500">
            {latestLog.itemsSynced} items synced
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400">
        Last synced: {formatDate(latestLog.startedAt)}
      </p>
      {latestLog.errorMessage && (
        <p className="text-xs text-red-500">Error: {latestLog.errorMessage}</p>
      )}
    </div>
  );
}
