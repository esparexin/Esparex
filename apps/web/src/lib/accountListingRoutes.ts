export const ACCOUNT_LISTING_STATUS_TABS = {
    ads: ["active", "pending", "expired"],
    services: ["active", "pending", "expired"],
    "spare-parts": ["active", "pending", "expired"],
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

    return "active";
}

export function buildAccountListingRoute(
    section: AccountListingSection,
    status: unknown = "active"
): string {
    const normalizedStatus = normalizeAccountListingStatus(section, status);
    return `/account/${section}?status=${encodeURIComponent(normalizedStatus)}`;
}
