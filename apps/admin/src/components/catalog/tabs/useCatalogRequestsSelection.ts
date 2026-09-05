"use client";

import { useState } from "react";
import type { CatalogRequestItem } from "@/lib/api/catalogRequests";

export function useCatalogRequestsSelection(requests: CatalogRequestItem[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const allSelected = requests.length > 0 && requests.every((item) => selectedIds.includes(item.id));
  const headerCheckedState = allSelected ? true : selectedIds.length > 0 ? ("indeterminate" as const) : false;

  const onToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(requests.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const onToggleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    }
  };

  return {
    selectedIds,
    setSelectedIds,
    headerCheckedState,
    onToggleSelectAll,
    onToggleSelect,
  };
}
