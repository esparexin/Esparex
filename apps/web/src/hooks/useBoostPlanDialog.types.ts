"use client";

import type { Plan as ApiPlan } from "@/lib/api/user/plans";

export type PromotionCategory = "SPOTLIGHT" | "BOOST_AD";

export type BoostPlan = ApiPlan & {
  durationDays: number;
  displayBoost: string;
};

export function getCreditRemaining(raw: unknown): number {
  if (typeof raw === "number") return raw;
  if (
    raw &&
    typeof raw === "object" &&
    "remaining" in raw &&
    typeof (raw as { remaining: number }).remaining === "number"
  ) {
    return (raw as { remaining: number }).remaining;
  }
  return 0;
}

export function formatPlanName(
  name?: string,
  category: PromotionCategory = "SPOTLIGHT"
): string {
  if (!name || name.toLowerCase().includes("new user plan")) {
    return category === "SPOTLIGHT"
      ? "Spotlight Featured Boost"
      : "Top Ad Priority Placement";
  }
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
