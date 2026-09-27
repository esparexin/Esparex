"use client";

import React from "react";
import { StatusChip } from "@esparex/ui";

export function StatusBadge({ status, className = "" }: { status: string; className?: string }) {
  return <StatusChip status={status} className={className} />;
}

export function getStatusBadge(status: string, _adId?: string | number): React.ReactNode {
  return <StatusBadge status={status} />;
}
