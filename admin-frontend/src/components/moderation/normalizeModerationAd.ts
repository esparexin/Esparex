import type { ModerationItem, ModerationStatus } from "./moderationTypes";

const asString = (value: unknown): string | undefined =>
    typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const normalizeIsoDate = (value: unknown): string | undefined => {
    const raw = asString(value);
    if (!raw) return undefined;
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

const computeDaysRemaining = (expiresAt?: string): number | undefined => {
    if (!expiresAt) return undefined;
    const expiresAtMs = new Date(expiresAt).getTime();
    if (!Number.isFinite(expiresAtMs)) return undefined;
    return Math.ceil((expiresAtMs - Date.now()) / DAY_IN_MS);
};

const normalizeSeller = (value: unknown): { sellerId?: string; sellerName?: string; sellerPhone?: string } => {
    if (!value || typeof value !== "object") {
        return { sellerId: asString(value) };
    }

    const record = value as Record<string, unknown>;
    const firstName = asString(record.firstName);
    const lastName = asString(record.lastName);
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

    return {
        sellerId: asString(record.id) || asString(record._id),
        sellerName: asString(record.name) || fullName || asString(record.phone) || "Unknown",
        sellerPhone:
            asString(record.phone) ||
            asString(record.mobile) ||
            asString(record.phoneNumber) ||
            asString(record.contactNumber)
    };
};

const normalizeLocationLabel = (value: unknown): string | undefined => {
    if (!value || typeof value !== "object") return undefined;
    const record = value as Record<string, unknown>;
    const fromDisplay = asString(record.display);
    if (fromDisplay) return fromDisplay;
    return asString(record.address);
};

const normalizeLocationCoordinates = (
    value: unknown
): { type: "Point"; coordinates: [number, number] } | undefined => {
    if (!value || typeof value !== "object") return undefined;
    const record = value as Record<string, unknown>;
    const coordinatesValue = record.coordinates;
    if (!coordinatesValue || typeof coordinatesValue !== "object") return undefined;
    const point = coordinatesValue as Record<string, unknown>;
    if (point.type !== "Point" || !Array.isArray(point.coordinates) || point.coordinates.length !== 2) {
        return undefined;
    }

    const lng = Number(point.coordinates[0]);
    const lat = Number(point.coordinates[1]);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return undefined;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return undefined;
    if (lng === 0 && lat === 0) return undefined;

    return {
        type: "Point",
        coordinates: [lng, lat],
    };
};

const normalizeStatus = (value: unknown): ModerationStatus => {
    const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
    if (
        normalized !== "pending"
        && normalized !== "live"
        && normalized !== "rejected"
        && normalized !== "deactivated"
        && normalized !== "sold"
        && normalized !== "expired"
    ) {
        throw new Error("Invalid moderation contract: listing status is missing or invalid");
    }
    return normalized as ModerationStatus;
};

export const normalizeModerationAd = (raw: Record<string, unknown>): ModerationItem => {
    const seller = normalizeSeller(raw.seller || raw.sellerId);
    if (!seller.sellerId && !seller.sellerName) {
        console.warn(`[Moderation] Missing seller reference for ad ${raw._id || raw.id}`);
    }
    const category = raw.category && typeof raw.category === "object" ? (raw.category as Record<string, unknown>) : null;
    const brand = raw.brand && typeof raw.brand === "object" ? (raw.brand as Record<string, unknown>) : null;
    const model = raw.model && typeof raw.model === "object" ? (raw.model as Record<string, unknown>) : null;

    const status = normalizeStatus(raw.status);
    const images = Array.isArray(raw.images)
        ? raw.images.filter((img): img is string => typeof img === "string")
        : [];

    const price = typeof raw.price === "number" ? raw.price : Number(raw.price || 0);
    const reportCount = typeof raw.reportCount === "number" ? raw.reportCount : 0;
    const fraudScore = typeof raw.fraudScore === "number" ? raw.fraudScore : 0;
    const riskScore =
        typeof raw.riskScore === "number"
            ? raw.riskScore
            : (typeof raw.fraudScore === "number" ? raw.fraudScore : undefined);
    const approvedAt = normalizeIsoDate(raw.approvedAt);
    const expiresAt = normalizeIsoDate(raw.expiresAt);
    const updatedAt = normalizeIsoDate(raw.updatedAt);
    const daysRemaining = computeDaysRemaining(expiresAt);
    const isDeleted = typeof raw.isDeleted === "boolean" ? raw.isDeleted : undefined;

    return {
        id: String(raw.id || raw._id || ""),
        title: asString(raw.title) || "Untitled ad",
        description: asString(raw.description),
        price: Number.isFinite(price) ? price : 0,
        currency: asString(raw.currency) || "INR",
        images,
        status,
        createdAt: asString(raw.createdAt) || new Date(0).toISOString(),
        updatedAt,
        isDeleted,
        approvedAt,
        expiresAt,
        daysRemaining,
        categoryName: asString(category?.name),
        brandName: asString(brand?.name),
        modelName: asString(model?.name),
        sellerId: seller.sellerId,
        sellerName: seller.sellerName,
        sellerPhone: seller.sellerPhone,
        locationLabel: normalizeLocationLabel(raw.location),
        locationCoordinates: normalizeLocationCoordinates(raw.location),
        devicePowerOn: typeof raw.devicePowerOn === "boolean" ? raw.devicePowerOn : undefined,
        reportCount,
        fraudScore,
        riskScore
    };
};
