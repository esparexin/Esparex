import { adminBusinessApprovalSchema } from "@/schemas/admin.schemas";
import { useAdminBusinessList } from "@/hooks/useAdminBusinessList";

const mapBaseOverview = (data: Record<string, unknown>) => ({
    total: Number(data.total || 0),
    pending: Number(data.pending || 0),
    live: Number(data.live || data.approved || 0),
});

export function useAdminBusinessRequestsList(activeTab: string) {
    return useAdminBusinessList({
        activeTab,
        initialOverview: { total: 0, pending: 0, live: 0, rejected: 0 },
        mapOverview: (data) => ({
            ...mapBaseOverview(data),
            rejected: Number(data.rejected || 0),
        }),
        rejectValidationMessage: (reason) => {
            const validation = adminBusinessApprovalSchema.safeParse({
                status: "REJECTED",
                reason,
            });

            return validation.success
                ? null
                : validation.error.issues[0]?.message || "Invalid rejection reason";
        },
    });
}

export function useAdminBusinessesMasterList(activeTab: string, cityFilter: string) {
    return useAdminBusinessList({
        activeTab,
        initialOverview: { total: 0, pending: 0, live: 0, suspended: 0 },
        mapOverview: (data) => ({
            ...mapBaseOverview(data),
            suspended: Number(data.suspended || 0),
        }),
        extraQueryParams: { city: cityFilter },
    });
}
