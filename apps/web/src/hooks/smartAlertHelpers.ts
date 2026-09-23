import { sanitizeMongoObjectId } from "@esparex/shared";
import type { SmartAlertListItem, SmartAlertFieldErrors, SmartAlertFormData } from "@/components/user/profile/types";

export interface SmartAlert {
    id: string;
    isActive?: boolean;
    active?: boolean;
    radiusKm?: number;
    notificationChannels?: string[];
    name?: string;
    criteria?: {
        keywords?: string;
        category?: string;
        location?: string;
        locationId?: string;
        radiusKm?: number;
    };
    lastMatch?: string;
    totalMatches?: number;
    [key: string]: unknown;
}

export const mapAlertToListItem = (alert: SmartAlert): SmartAlertListItem => {
    const record = alert as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name : "Smart Alert";
    const criteriaRaw = record.criteria;
    const criteria = typeof criteriaRaw === "object" && criteriaRaw !== undefined ? (criteriaRaw as Record<string, unknown>) : null;
    const keywords = typeof criteria?.keywords === "string" ? criteria.keywords : "";
    const category = typeof criteria?.category === "string" ? criteria.category : "";
    const locationId = typeof criteria?.locationId === "string" ? criteria.locationId : undefined;
    const location = typeof criteria?.location === "string" ? criteria.location : "";
    const radius =
        typeof record.radiusKm === "number"
            ? record.radiusKm
            : typeof criteria?.radiusKm === "number"
              ? criteria.radiusKm
              : undefined;
    const notificationChannels = Array.isArray(record.notificationChannels)
        ? record.notificationChannels.filter((value): value is string => typeof value === "string")
        : undefined;

    return {
        id: alert.id,
        name,
        keywords,
        category,
        location,
        locationId: sanitizeMongoObjectId(locationId),
        radiusKm: radius,
        lastMatch: typeof record.lastMatch === "string" ? record.lastMatch : undefined,
        totalMatches: typeof record.totalMatches === "number" ? record.totalMatches : undefined,
        active: typeof alert.isActive === "boolean" ? alert.isActive : (typeof alert.active === "boolean" ? alert.active : true),
        notificationChannels,
        createdAt:
            typeof record.createdAt === "string"
                ? record.createdAt
                : record.createdAt instanceof Date
                  ? record.createdAt.toISOString()
                  : undefined,
    };
};

export const deriveSmartAlertName = (data: {
    category?: string;
    brand?: string;
    model?: string;
    keywords?: string;
    location?: string;
    radiusKm?: number;
}): string => {
    const parts: string[] = [];
    if (data.brand && data.model) {
        parts.push(`${data.brand} ${data.model}`);
    } else if (data.brand) {
        parts.push(data.brand);
    } else if (data.keywords?.trim()) {
        parts.push(data.keywords.trim());
    } else if (data.category?.trim()) {
        parts.push(data.category.trim());
    } else {
        parts.push("Smart Alert");
    }

    if (data.location?.trim()) {
        const radius = data.radiusKm ? ` (${data.radiusKm}km)` : "";
        parts.push(`in ${data.location.trim()}${radius}`);
    }

    return parts.join(" ");
};

export const createInitialSmartAlertForm = (): SmartAlertFormData => ({
    name: "",
    keywords: "",
    category: "",
    brand: "",
    model: "",
    location: "",
    locationId: null,
    radiusKm: 25,
    notificationChannels: ["push", "email"],
});

export const emptySmartAlertFieldErrors = (): SmartAlertFieldErrors => ({
    name: undefined,
    keywords: undefined,
    category: undefined,
    location: undefined,
    radiusKm: undefined,
    notificationChannels: undefined,
});
