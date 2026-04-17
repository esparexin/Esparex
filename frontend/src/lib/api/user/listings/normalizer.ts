import { type Ad, AdSchema } from '@shared/schemas/ad.schema';
import { type PaginationEnvelope } from '@/lib/api/result';
import { normalizeAdStatus } from '@/lib/status/statusNormalization';
import { toSafeImageArray, toSafeImageSrc } from '@/lib/image/imageUrl';
import { normalizeToAppLocation as normalizeLocation } from '@/lib/location/locationService';
import type { LocationLevel } from '@/types/location';
import { stripEmptyObjectIdFields as stripSharedObjectIdFields } from '../listingsShared';

// --- Shared Constants & Types ---

export const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;
export const LISTING_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const RESERVED_LISTING_IDENTIFIERS = new Set([
    '', 'undefined', 'null', 'nan', 'true', 'false', 'favicon.ico',
]);

export interface Listing extends Ad {
    priceMin?: number | null;
    priceMax?: number | null;
    isChatLocked?: boolean;
    serviceId?: string;
    sparePartId?: string;
    onsiteService?: boolean;
    turnaroundTime?: string;
}

export interface ListingFilters {
    category?: string;
    categoryId?: string;
    brandId?: string;
    modelId?: string;
    location?: string;
    locationId?: string;
    level?: LocationLevel;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    cursor?: string;
    sellerId?: string;
    lat?: number;
    lng?: number;
    radiusKm?: number;
    sortBy?: string;
    type?: string; 
}

export interface ListingPageResult {
    data: Listing[];
    pagination: PaginationEnvelope;
}

export interface ListingAnalytics {
    id?: string | number;
    views?: number | {
        total?: number;
        unique?: number;
        lastViewedAt?: string;
    };
}

export interface ListingPhoneResponse {
    phone?: string;
    mobile?: string;
    masked?: string;
}

// --- Helpers ---

export function normalizeListingIdentifier(value: string | number): string {
    const raw = String(value).trim();
    if (!raw) return '';
    try {
        return decodeURIComponent(raw).trim();
    } catch {
        return raw;
    }
}

export function isValidListingIdentifier(value: string | number): boolean {
    const identifier = normalizeListingIdentifier(value);
    if (!identifier || identifier.length > 200) return false;
    if (RESERVED_LISTING_IDENTIFIERS.has(identifier.toLowerCase())) return false;
    if (identifier.includes("/") || identifier.includes("\\")) return false;

    if (OBJECT_ID_PATTERN.test(identifier)) return true;
    if (identifier.length < 2) return false;
    return LISTING_SLUG_PATTERN.test(identifier.toLowerCase());
}

export const isValidAdIdentifier = isValidListingIdentifier;

export function extractId(value: unknown): string | undefined {
    if (typeof value === 'string' || typeof value === 'number') {
        return String(value);
    }
    if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>;
        return String(record.id || record._id || '');
    }
    return undefined;
}

function normalizeImageUrl(url: string): string {
    const normalized = toSafeImageSrc(url, '').trim();
    if (!normalized) return normalized;
    try {
        const parsed = new URL(normalized);
        if (parsed.hostname !== 'placehold.co') return normalized;
        const parts = parsed.pathname.split('/').filter(Boolean);
        if (parts.length === 0) return normalized;
        const hasExplicitFormat = parts.length >= 2 && ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(parts[1]!.toLowerCase());
        if (hasExplicitFormat) return normalized;
        parsed.pathname = `/${parts[0]}/png`;
        return parsed.toString();
    } catch { return normalized; }
}

function toListingSchemaCompatible(data: unknown): unknown {
    if (!data || typeof data !== 'object') return data;
    const record = { ...(data as Record<string, unknown>) };
    const normalizedId = extractId(record.id) ?? extractId(record._id);
    if (normalizedId) record.id = normalizedId;
    if (record.createdAt instanceof Date) record.createdAt = record.createdAt.toISOString();
    if (record.updatedAt instanceof Date) record.updatedAt = record.updatedAt.toISOString();

    const toLegacyStringField = (value: unknown): string | undefined => {
        if (typeof value === 'string' || typeof value === 'number') return String(value);
        if (value && typeof value === 'object') {
            const objectValue = value as Record<string, unknown>;
            if (typeof objectValue.name === 'string' && objectValue.name.trim().length > 0) return objectValue.name.trim();
            if (typeof objectValue.title === 'string' && objectValue.title.trim().length > 0) return objectValue.title.trim();
            return extractId(objectValue);
        }
        return undefined;
    };

    const rawSellerId = record.sellerId;
    const normalizedSellerId = extractId(rawSellerId);
    if (normalizedSellerId) record.sellerId = normalizedSellerId;
    // Keep inbound legacy alias readable, but never synthesize/write it.
    const normalizedUserId = extractId(record.userId);
    if (normalizedUserId) {
        record.userId = normalizedUserId;
    } else {
        delete record.userId;
    }

    if (record.verified === undefined && rawSellerId && typeof rawSellerId === 'object') {
        const sellerRecord = rawSellerId as Record<string, unknown>;
        if (typeof sellerRecord.isVerified === 'boolean') {
            record.verified = sellerRecord.isVerified;
        }
    }

    const normalizeReferenceField = (
        idKey: "categoryId" | "brandId" | "modelId" | "businessId",
        labelKey: "category" | "brand" | "model" | null
    ) => {
        const reference = record[idKey];
        const normalizedId = extractId(reference);
        if (normalizedId) {
            record[idKey] = normalizedId;
        } else if (reference !== undefined && typeof reference === "object") {
            delete record[idKey];
        }

        if (labelKey && record[labelKey] === undefined) {
            const normalizedLabel = toLegacyStringField(reference);
            // Never use a raw 24-char ObjectId hex as a human-readable label
            if (normalizedLabel && !/^[0-9a-f]{24}$/i.test(normalizedLabel)) {
                record[labelKey] = normalizedLabel;
            }
        }
    };

    normalizeReferenceField("categoryId", "category");
    normalizeReferenceField("brandId", "brand");
    normalizeReferenceField("modelId", "model");
    normalizeReferenceField("businessId", null);

    const OBJECTID_RE = /^[0-9a-f]{24}$/i;
    // Prefer the flat categoryName field emitted by the backend hydration
    if (typeof record.categoryName === 'string' && record.categoryName.trim()) {
        record.category = record.categoryName.trim();
    } else if (record.category !== undefined) {
        const norm = toLegacyStringField(record.category);
        (norm && !OBJECTID_RE.test(norm)) ? record.category = norm : delete record.category;
    }
    if (record.brand !== undefined) {
        const norm = toLegacyStringField(record.brand);
        (norm && !OBJECTID_RE.test(norm)) ? record.brand = norm : delete record.brand;
    }
    if (record.model !== undefined) {
        const norm = toLegacyStringField(record.model);
        (norm && !OBJECTID_RE.test(norm)) ? record.model = norm : delete record.model;
    }
    return record;
}

function coerceListingFallback(data: unknown): Listing {
    const record = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
    const id = extractId(record.id) ?? extractId(record._id) ?? '';
    const title = typeof record.title === 'string' ? record.title : '';
    const description = typeof record.description === 'string' ? record.description : '';
    const price = typeof record.price === 'number' ? record.price : (typeof record.price === 'string' ? Number(record.price) : 0);
    const createdAt = typeof record.createdAt === 'string' ? record.createdAt : (record.createdAt instanceof Date ? record.createdAt.toISOString() : new Date(0).toISOString());

    const rawLocation = (record.location && typeof record.location === 'object' && !Array.isArray(record.location)) 
        ? (record.location as Record<string, unknown>) 
        : {};

    const fallbackLocation = {
        city: typeof rawLocation.city === 'string' ? rawLocation.city : "",
        state: typeof rawLocation.state === 'string' ? rawLocation.state : undefined,
        country: typeof rawLocation.country === 'string' ? rawLocation.country : undefined,
    };

    return {
        id, title, description,
        price: Number.isFinite(price) ? price : 0,
        images: Array.isArray(record.images) ? record.images.filter((img): img is string => typeof img === 'string').map(normalizeImageUrl) : [],
        location: fallbackLocation,
        status: normalizeAdStatus(typeof record.status === 'string' ? record.status : 'pending'),
        sellerId: extractId(record.sellerId) ?? extractId(record.userId) ?? '',
        createdAt,
        updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : (record.updatedAt instanceof Date ? record.updatedAt.toISOString() : undefined),
        views: typeof record.views === 'number' ? record.views : 0,
        spareParts: Array.isArray(record.spareParts) ? (record.spareParts as (string | Record<string, unknown>)[]) : undefined,
    } as Listing;
}

export function unwrapListingPayload(data: unknown, depth = 0): unknown {
    if (depth > 3 || !data || typeof data !== 'object') return data;
    const record = data as Record<string, unknown>;
    if (record.ad && typeof record.ad === 'object') return record.ad;
    if (record.listing && typeof record.listing === 'object') return record.listing;
    if (record.data && typeof record.data === 'object') return unwrapListingPayload(record.data, depth + 1);
    return data;
}

export function normalizeListing(data: unknown): Listing {
    const compatible = toListingSchemaCompatible(unwrapListingPayload(data));
    const parsed = AdSchema.safeParse(compatible);
    const validated = parsed.success ? parsed.data : coerceListingFallback(compatible);
    const { userId: _legacyUserId, ...validatedWithoutLegacyUserId } =
        validated as Listing & { userId?: string };
    
    const location = normalizeLocation(validated.location);
    
    const views = validated.views;

    const explicitSellerName =
        typeof validated.sellerName === 'string' && validated.sellerName.trim().length > 0
            ? validated.sellerName.trim()
            : '';
    const businessName =
        typeof validated.businessName === 'string' && validated.businessName.trim().length > 0
            ? validated.businessName.trim()
            : '';
    
    // Legacy seller name extraction
    let legacySellerName = '';
    const seller = validated.seller;
    if (typeof seller === 'string') {
        legacySellerName = seller.trim();
    } else if (seller && typeof seller === 'object') {
        const sr = seller as Record<string, unknown>;
        legacySellerName = String(sr.name || sr.businessName || '').trim();
    }

    const isBusiness =
        validated.sellerType === 'business'
        || (typeof seller === 'object' && seller !== null && (seller as Record<string, unknown>).role === 'business')
        || !!validated.businessId;

    const sellerName = (isBusiness && businessName)
        ? businessName
        : explicitSellerName || legacySellerName || businessName || 'Esparex Seller';

    const verified = (typeof seller === 'object' && seller !== null && (seller as Record<string, unknown>).isVerified === true) 
        || validated.verified === true;

    // Pre-coerce createdAt to string — AdSchema types it as string, so this
    // is always the first branch. The fallback guards against pre-schema raw data.
    const rawCreatedAt = validatedWithoutLegacyUserId.createdAt;
    const createdAtStr: string =
        typeof rawCreatedAt === 'string' ? rawCreatedAt : new Date(0).toISOString();

    return {
        ...validatedWithoutLegacyUserId,
        status: normalizeAdStatus(validatedWithoutLegacyUserId.status),
        id: String(validatedWithoutLegacyUserId.id || ''),
        images: toSafeImageArray(Array.isArray(validatedWithoutLegacyUserId.images) ? validatedWithoutLegacyUserId.images.map((image) => normalizeImageUrl(String(image))) : validatedWithoutLegacyUserId.images),
        image: toSafeImageSrc(Array.isArray(validatedWithoutLegacyUserId.images) && validatedWithoutLegacyUserId.images.length > 0 ? normalizeImageUrl(String(validatedWithoutLegacyUserId.images[0])) : (typeof validatedWithoutLegacyUserId.image === 'string' ? normalizeImageUrl(validatedWithoutLegacyUserId.image) : validatedWithoutLegacyUserId.image)),
        time: new Date(createdAtStr).toLocaleDateString(),
        createdAt: createdAtStr,
        isBusiness,
        verified,
        sellerName,
        sellerId: extractId(validatedWithoutLegacyUserId.sellerId) || '',
        views,
        location: (location || { city: "" }) as Listing['location'],
    } as Listing;
}

export function stripEmptyObjectIdFields<T extends Record<string, unknown>>(payload: T): T {
    const cleaned = stripSharedObjectIdFields(payload, { extractId }) as Record<string, unknown>;
    if (cleaned.location && typeof cleaned.location === "object" && !Array.isArray(cleaned.location)) {
        const location = { ...(cleaned.location as Record<string, unknown>) };
        const locationId = extractId(location.locationId);
        if (locationId && OBJECT_ID_PATTERN.test(locationId)) {
            location.locationId = locationId;
        } else {
            delete location.locationId;
        }
        cleaned.location = location;
    }
    return cleaned as T;
}
