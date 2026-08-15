"use client";

import React from "react";

export function StatusBadge({ status, className = "" }: { status: string; className?: string }) {
  const renderBadge = (label: string, styleClass: string) => (
    <span className={`px-2 py-0.5 rounded text-2xs uppercase tracking-wider font-semibold ${styleClass} ${className}`}>
      {label}
    </span>
  );

  switch (status?.toLowerCase()) {
    case "live":
    case "active":
    case "approved":
    case "published":
      return renderBadge("Live", "bg-emerald-100 text-emerald-700");
    case "pending":
      return renderBadge("Pending", "bg-amber-100 text-amber-700");
    case "sold":
      return renderBadge("Sold", "bg-blue-100 text-link-dark");
    case "rejected":
      return renderBadge("Rejected", "bg-red-100 text-red-700");
    case "expired":
      return renderBadge("Expired", "bg-slate-200 text-foreground-secondary");
    case "deactivated":
      return renderBadge("Deactivated", "bg-orange-100 text-orange-700");
    default:
      return renderBadge(status || "Unknown", "bg-gray-100 text-foreground-tertiary");
  }
}

export function getStatusBadge(status: string, _adId?: string | number): React.ReactNode {
  return <StatusBadge status={status} />;
}
