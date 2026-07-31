export interface PlanFeatures {
    priorityWeight?: number;
    businessBadge?: boolean;
    canEditAd?: boolean;
    showOnHomePage?: boolean;
}

export interface PlanLimits {
    maxAds?: number;
    maxServices?: number;
    maxParts?: number;
    smartAlerts?: number;
    spotlightCredits?: number;
}

export interface SmartAlertConfig {
    maxAlerts?: number;
    matchFrequency?: "instant" | "hourly" | "daily";
    radiusLimitKm?: number;
    notificationChannels?: string[];
}

export type PlanCategory = "FREE" | "AD_PACK" | "BOOST" | "SPOTLIGHT" | "SMART_ALERT";
export type PlanType = "FREE_DEFAULT" | "AD_PACK" | "BOOST_AD" | "SPOTLIGHT" | "SMART_ALERT";
export type PlanUserType = "normal" | "business" | "both";
export type PlanStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";

export interface Plan {
    id: string;
    code: string;
    name: string;
    description?: string;
    type: PlanType;
    category?: PlanCategory;
    userType: PlanUserType;
    durationDays?: number;
    duration?: string;

    limits?: PlanLimits;
    smartAlertConfig?: SmartAlertConfig;
    features?: PlanFeatures;

    credits: number;
    price: number;
    currency: string;
    /** @deprecated Legacy field. Use `status` as SSOT. Kept for backward compatibility. */
    active: boolean;
    isDefault?: boolean;
    /** Canonical lifecycle status — Single Source of Truth for plan state. */
    status?: PlanStatus;
    /** True for system-protected plans (e.g. FREE_DEFAULT fallback). Cannot be archived. */
    isSystemPlan?: boolean;
    archivedAt?: string | Date | null;
    archivedByAdmin?: string | null;
    archiveReason?: string | null;
    restoredAt?: string | Date | null;
    restoredByAdmin?: string | null;

    createdAt?: string | Date;
    updatedAt?: string | Date;
}
