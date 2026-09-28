"use client";

import React from "react";
import { StatusChip } from "@esparex/ui";

export function getStatusBadge(status: string): React.ReactNode {
  return <StatusChip status={status} />;
}

