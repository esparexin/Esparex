export const ACCOUNT_LISTING_STATUS_TABS = {
    ads: ["live", "pending", "expired"],
    services: ["live", "pending", "expired"],
    "spare-parts": ["live", "pending", "expired"],
} as const;

export type AccountListingSection = keyof typeof ACCOUNT_LISTING_STATUS_TABS;
export type AccountListingStatus = (typeof ACCOUNT_LISTING_STATUS_TABS)["ads"][number];

export function normalizeAccountListingStatus(
    section: AccountListingSection,
    status: unknown
): AccountListingStatus {
    const allowedStatuses = ACCOUNT_LISTING_STATUS_TABS[section] as readonly string[];
    const normalized = typeof status === "string" ? status.trim().toLowerCase() : "";

    if (allowedStatuses.includes(normalized)) {
        return normalized as AccountListingStatus;
    }

    return "live";
}

export function buildAccountListingRoute(
    section: AccountListingSection,
    status: unknown = "live"
): string {
    const normalizedStatus = normalizeAccountListingStatus(section, status);
    return `/account/${section}?status=${encodeURIComponent(normalizedStatus)}`;
}
