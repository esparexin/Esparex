import { adminFetch } from "@/lib/api/adminClient";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { ADMIN_UI_ROUTES, adminListingModerationRoute } from "@/lib/adminUiRoutes";

export type AdminSearchBucket = "users" | "ads" | "businesses" | "reports" | "transactions";

export type AdminSearchItem = {
    id: string;
    label: string;
    meta: string;
    href: string;
};

export type AdminSearchState = Record<AdminSearchBucket, AdminSearchItem[]>;

export const EMPTY_ADMIN_SEARCH_STATE: AdminSearchState = {
    users: [],
    ads: [],
    businesses: [],
    reports: [],
    transactions: [],
};

const buildQuery = (params: Record<string, string>) => new URLSearchParams(params).toString();

export async function searchAdminRecords(
    search: string,
    limit = 3
): Promise<AdminSearchState> {
    const normalizedSearch = search.trim();
    const normalizedLimit = String(limit);

    const [users, ads, businesses, reports, transactions] = await Promise.all([
        adminFetch<unknown>(
            `${ADMIN_ROUTES.USERS}?${buildQuery({ q: normalizedSearch, page: "1", limit: normalizedLimit })}`
        ),
        adminFetch<unknown>(
            `${ADMIN_ROUTES.LISTINGS}?${buildQuery({ q: normalizedSearch, page: "1", limit: normalizedLimit })}`
        ),
        adminFetch<unknown>(
            `${ADMIN_ROUTES.BUSINESS_ACCOUNTS}?${buildQuery({
                q: normalizedSearch,
                page: "1",
                limit: normalizedLimit,
                status: "all",
            })}`
        ),
        adminFetch<unknown>(
            `${ADMIN_ROUTES.REPORTED_ADS}?${buildQuery({ q: normalizedSearch, page: "1", limit: normalizedLimit })}`
        ),
        adminFetch<unknown>(
            `${ADMIN_ROUTES.FINANCE_TRANSACTIONS}?${buildQuery({ q: normalizedSearch, page: "1", limit: normalizedLimit })}`
        ),
    ]);

    return {
        users: parseAdminResponse<Record<string, unknown>>(users).items.map((item) => ({
            id: String(item.id || item._id || item.mobile || ""),
            label: String(item.name || item.mobile || "Unknown user"),
            meta: String(item.mobile || item.email || "User"),
            href: ADMIN_UI_ROUTES.users({ q: normalizedSearch }),
        })),
        ads: parseAdminResponse<Record<string, unknown>>(ads).items.map((item) => ({
            id: String(item.id || item._id || ""),
            label: String(item.title || item.id || "Untitled ad"),
            meta: String(item.status || item.sellerName || item.listingType || "Listing"),
            href: adminListingModerationRoute(
                item.listingType === "service"
                    ? "service"
                    : item.listingType === "spare_part"
                        ? "spare_part"
                        : "ad",
                { q: normalizedSearch }
            ),
        })),
        businesses: parseAdminResponse<Record<string, unknown>>(businesses).items.map((item) => ({
            id: String(item.id || item._id || ""),
            label: String(item.name || item.email || "Business"),
            meta: String(item.status || item.email || "Business"),
            href: ADMIN_UI_ROUTES.businesses({ status: "all", q: normalizedSearch }),
        })),
        reports: parseAdminResponse<Record<string, unknown>>(reports).items.map((item) => ({
            id: String(item.id || item._id || ""),
            label: String(item.reason || item.reportType || "Report"),
            meta: String(item.status || item.adId || "Report"),
            href: ADMIN_UI_ROUTES.reports({ q: normalizedSearch }),
        })),
        transactions: parseAdminResponse<Record<string, unknown>>(transactions).items.map((item) => ({
            id: String(item.id || item._id || ""),
            label: String(item.reference || item.transactionId || "Transaction"),
            meta: String(item.status || item.amount || "Transaction"),
            href: ADMIN_UI_ROUTES.finance({ q: normalizedSearch }),
        })),
    };
}
