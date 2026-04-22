import { adminFetch } from "@/lib/api/adminClient";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { fetchAdminModerationSummary } from "@/lib/api/moderation";

export type SidebarCounters = Partial<
    Record<"ads" | "reports" | "businesses" | "services", string | number>
>;

export async function fetchAdminSidebarCounts(): Promise<SidebarCounters> {
    const [moderationSummary, reportPayload, businessOverviewPayload] = await Promise.all([
        fetchAdminModerationSummary().catch(() => null),
        adminFetch<unknown>(
            `${ADMIN_ROUTES.REPORTED_ADS}?${new URLSearchParams({
                status: "open",
                page: "1",
                limit: "1",
            }).toString()}`
        ).catch(() => null),
        adminFetch<unknown>(ADMIN_ROUTES.BUSINESS_OVERVIEW).catch(() => null),
    ]);

    const reportPagination = reportPayload
        ? parseAdminResponse<Record<string, unknown>>(reportPayload).pagination
        : undefined;
    const businessOverview = businessOverviewPayload
        ? parseAdminResponse<never, Record<string, unknown>>(businessOverviewPayload).data ?? {}
        : {};

    return {
        ads: moderationSummary
            ? `${moderationSummary.total} (P:${moderationSummary.pending}/L:${moderationSummary.live})`
            : 0,
        reports: reportPagination?.total ?? 0,
        businesses: Number(businessOverview.pending || 0),
    };
}
