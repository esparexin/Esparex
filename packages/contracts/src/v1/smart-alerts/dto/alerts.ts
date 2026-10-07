/**
 * Phase 3a (§5) — canonical smart-alert response DTOs.
 *
 * Relocated from `apps/web/src/lib/api/user/smartAlerts.ts`
 * (`SmartAlertMatchRecord:88`, `FetchSmartAlertMatchesResponse:113`) and
 * `core/src/domains/notifications/application/SmartAlertMutationService.ts:22,33`
 * (`SmartAlertCriteriaPayload`, `SmartAlertPayload`) — DECISION-GATE §5;
 * evidence `areas/04-contract-ssot.md` Finding 3 (unique API payloads with
 * no contract home).
 */
export interface SmartAlertMatchRecord {
    id: string;
    alertId: string;
    alertName: string;
    deliveredAt: string | Date;
    isRead: boolean;
    adId: string;
    actionUrl?: string;
    ad?: {
        id: string;
        title: string;
        price: number;
        currency?: string;
        images?: string[];
        status: string;
        location?: {
            city?: string;
            state?: string;
            display?: string;
        };
        seoSlug?: string;
        listingType?: string;
    } | null;
}

export interface FetchSmartAlertMatchesResponse {
    matches: SmartAlertMatchRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export type SmartAlertCriteriaPayload = {
    keywords?: string;
    category?: string;
    brand?: string;
    model?: string;
    categoryId?: unknown;
    brandId?: unknown;
    modelId?: unknown;
    coordinates?: unknown;
} & Record<string, unknown>;

export type SmartAlertPayload = {
    criteria?: SmartAlertCriteriaPayload;
    frequency?: unknown;
    name?: unknown;
    coordinates?: unknown;
    radiusKm?: unknown;
    notificationChannels?: unknown;
} & Record<string, unknown>;
