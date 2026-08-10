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

import { formatPlanName } from "@esparex/shared";
export { formatPlanName };
