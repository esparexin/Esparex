// TODO: unify with shared/types
export interface Plan {
    id: string; // The backend uses the toJSON transform to convert _id to id
    code: string;
    name: string;
    description?: string;
    type: "AD_PACK" | "SPOTLIGHT" | "SMART_ALERT";
    userType: "normal" | "business" | "both";
    durationDays?: number;
    
    limits?: {
        maxAds?: number;
        maxServices?: number;
        maxParts?: number;
        smartAlerts?: number;
        spotlightCredits?: number;
    };

    smartAlertConfig?: {
        maxAlerts?: number;
        matchFrequency?: "realtime" | "hourly" | "daily";
        radiusLimitKm?: number;
        notificationChannels?: string[];
    };
    
    features?: {
        priorityWeight?: number;
        businessBadge?: boolean;
        canEditAd?: boolean;
        showOnHomePage?: boolean;
    };
    
    credits: number;
    price: number;
    currency: string;
    active: boolean;
    isDefault?: boolean;
    createdAt: string;
    updatedAt: string;
}
