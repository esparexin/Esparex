"use client";

import React from "react";
import { StatusChip } from "@esparex/ui";

export function getStatusBadge(status: string, _adId?: string | number): React.ReactNode {
  return <StatusChip status={status} />;
}

