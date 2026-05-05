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
    matchFrequency?: "realtime" | "hourly" | "daily";
    radiusLimitKm?: number;
    notificationChannels?: string[];
}

export type PlanType = "AD_PACK" | "SPOTLIGHT" | "SMART_ALERT";
export type PlanUserType = "normal" | "business" | "both";

export interface Plan {
    id: string;
    code: string;
    name: string;
    description?: string;
    type: PlanType;
    userType: PlanUserType;
    durationDays?: number;
    duration?: string;

    limits?: PlanLimits;
    smartAlertConfig?: SmartAlertConfig;
    features?: PlanFeatures;

    credits: number;
    price: number;
    currency: string;
    active: boolean;
    isDefault?: boolean;
    
    createdAt?: string | Date;
    updatedAt?: string | Date;
}
