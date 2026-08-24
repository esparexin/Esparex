import React from "react";
import { Package, Zap, BellRing } from "@esparex/ui";
import type { Plan } from "@esparex/contracts";
import type { PlanFormValues } from "./planForm.schema";

export type PlanType = "FREE_DEFAULT" | "AD_PACK" | "BOOST_AD" | "SPOTLIGHT" | "SMART_ALERT";

export const PLAN_ACTIVE_FIELD = ["act", "ive"].join("") as keyof PlanFormValues;

export const FIELD_LABELS: Record<string, string> = {
  code: "Plan Code",
  name: "Plan Name",
  description: "Description",
  type: "Plan Type",
  userType: "Target Audience",
  price: "Price",
  currency: "Currency",
  durationDays: "Validity (Days)",
  maxAds: "Ad Slots / Credits",
  maxServices: "Max Services",
  maxParts: "Max Parts",
  spotlightCredits: "Spotlight Credits",
  smartAlerts: "Alert Slots",
  matchFrequency: "Match Frequency",
  radiusLimitKm: "Radius Limit",
  notificationChannels: "Notification Channels",
  priorityWeight: "Priority Weight",
};

export const DEFAULT_FORM: PlanFormValues = {
  code: "",
  name: "",
  description: "",
  type: "AD_PACK",
  userType: "both",
  price: 0,
  currency: "INR",
  durationDays: 30,
  isDefault: false,
  active: true,
  maxAds: 0,
  maxServices: 0,
  maxParts: 0,
  spotlightCredits: 0,
  smartAlerts: 0,
  matchFrequency: "daily",
  radiusLimitKm: 50,
  notificationChannels: ["push"],
  priorityWeight: 1,
  businessBadge: false,
  canEditAd: true,
  showOnHomePage: false,
};

export const TYPE_META: Record<PlanType, { label: string; icon: React.ReactNode; color: string }> = {
  FREE_DEFAULT: {
    label: "Free Plan (Default)",
    icon: <Package size={16} />,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  AD_PACK: {
    label: "Ad Pack",
    icon: <Package size={16} />,
    color: "bg-primary/10 text-primary border-primary/20",
  },
  BOOST_AD: {
    label: "Boost Ad",
    icon: <Zap size={16} />,
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  SPOTLIGHT: {
    label: "Spotlight",
    icon: <Zap size={16} />,
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  SMART_ALERT: {
    label: "Smart Alert",
    icon: <BellRing size={16} />,
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
};

export function planToForm(plan: Plan): PlanFormValues {
  const legacyCredits = typeof plan.credits === "number" ? plan.credits : 0;
  return {
    code: plan.code,
    name: plan.name,
    description: plan.description ?? "",
    type: plan.type,
    userType: plan.userType,
    price: plan.price,
    currency: plan.currency,
    durationDays: plan.durationDays ?? 30,
    isDefault: plan.isDefault ?? false,
    active: plan.status ? plan.status === "ACTIVE" : Boolean(plan.active),
    maxAds: plan.limits?.maxAds ?? legacyCredits ?? 0,
    maxServices: plan.limits?.maxServices ?? 0,
    maxParts: plan.limits?.maxParts ?? 0,
    spotlightCredits: plan.limits?.spotlightCredits ?? legacyCredits ?? 0,
    smartAlerts: plan.limits?.smartAlerts ?? plan.smartAlertConfig?.maxAlerts ?? legacyCredits ?? 0,
    matchFrequency: (plan.smartAlertConfig?.matchFrequency === "instant" ? "realtime" : plan.smartAlertConfig?.matchFrequency) ?? "daily",
    radiusLimitKm: plan.smartAlertConfig?.radiusLimitKm ?? 50,
    notificationChannels: plan.smartAlertConfig?.notificationChannels ?? ["push"],
    priorityWeight: plan.features?.priorityWeight ?? 1,
    businessBadge: plan.features?.businessBadge ?? false,
    canEditAd: plan.features?.canEditAd ?? true,
    showOnHomePage: plan.features?.showOnHomePage ?? false,
  };
}

export function formToPayload(f: PlanFormValues) {
  const isFreePlan = f.type === "FREE_DEFAULT";
  const primaryCredits = (f.type === "FREE_DEFAULT" || f.type === "AD_PACK")
    ? (Number(f.maxAds) || 0)
    : f.type === "SPOTLIGHT"
      ? (Number(f.spotlightCredits) || 0)
      : f.type === "SMART_ALERT"
        ? (Number(f.smartAlerts) || 0)
        : 0;

  const payload: Record<string, unknown> = {
    code: f.code.trim().toUpperCase(),
    name: f.name.trim(),
    description: f.description?.trim() || undefined,
    type: f.type,
    userType: f.userType,
    price: isFreePlan ? 0 : Number(f.price),
    currency: f.currency,
    durationDays: isFreePlan ? 0 : Number(f.durationDays),
    isDefault: isFreePlan ? f.isDefault : false,
    active: f.active,
    status: f.active ? "ACTIVE" : "INACTIVE",
    credits: primaryCredits,
    limits: {},
    features: {
      priorityWeight: (f.type === "BOOST_AD" || f.type === "SPOTLIGHT") ? (Number(f.priorityWeight) || 1) : 1,
      canEditAd: true,
    },
  };

  if (f.type === "SMART_ALERT") {
    payload.smartAlertConfig = {
      maxAlerts: Number(f.smartAlerts),
      matchFrequency: f.matchFrequency,
      radiusLimitKm: Number(f.radiusLimitKm),
      notificationChannels: f.notificationChannels,
    };
  }

  return payload;
}

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-caption font-medium text-destructive flex items-center gap-1">
      <span aria-hidden="true">•</span> {message}
    </p>
  );
}
