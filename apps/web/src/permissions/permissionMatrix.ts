export type Role = "user" | "business";
import { BusinessStatusValue as BusinessStatus } from "@shared/enums/businessStatus";
import { normalizeBusinessStatus } from "@/lib/status/statusNormalization";

export const PERMISSIONS = {
    postAd: {
        user: true,
        business: true,
    },
    postService: {
        business: (status: BusinessStatus) =>
            normalizeBusinessStatus(status, "pending") === "live",
        user: false,
    },
    postParts: {
        business: (status: BusinessStatus) =>
            normalizeBusinessStatus(status, "pending") === "live",
        user: false,
    },
    accessBusinessDashboard: {
        business: (status: BusinessStatus) =>
            normalizeBusinessStatus(status, "pending") === "live",
        user: false,
    },
    viewBusinessPlans: {
        business: true,
        user: false,
    },
} as const;
