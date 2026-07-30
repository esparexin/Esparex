export type PermissionAction =
    | "postAd"
    | "postService"
    | "postParts"
    | "accessBusinessDashboard"
    | "viewBusinessPlans";

export interface PermissionDefinition {
    requiresAuth: boolean;
    requiresBusinessApproved: boolean;
}

export const PERMISSIONS: Record<PermissionAction, PermissionDefinition> = {
    postAd: {
        requiresAuth: true,
        requiresBusinessApproved: false,
    },
    postService: {
        requiresAuth: true,
        requiresBusinessApproved: true,
    },
    postParts: {
        requiresAuth: true,
        requiresBusinessApproved: true,
    },
    accessBusinessDashboard: {
        requiresAuth: true,
        requiresBusinessApproved: true,
    },
    viewBusinessPlans: {
        requiresAuth: true,
        requiresBusinessApproved: false,
    },
} as const;
