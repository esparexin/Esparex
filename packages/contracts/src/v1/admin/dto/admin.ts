export interface AdminUser {
    id: string;
    _id?: string;
    email: string;
    username?: string; // Often mapped from email or name
    firstName?: string; // Split name (admin app convention)
    lastName?: string; // Split name (admin app convention)
    role: 'super_admin' | 'superAdmin' | 'admin' | 'moderator' | 'editor' | 'viewer' | 'user_manager' | 'content_moderator' | 'finance_manager' | 'custom';
    name?: string; // Unified display name (required by frontend)
    permissions?: string[];
    lastLogin?: string;
    isActive?: boolean;
    status?: 'active' | 'inactive'; // Frontend compatibility
    createdAt?: string;
}

export interface AdminStats {
    totalUsers: number;
    totalAds: number;
    totalBusinesses: number;
    pendingAds: number;
    pendingServices: number;
    pendingBusinesses: number;
    activeServices?: number;
    totalServices?: number;
}

export interface CatalogHealthMetricsDTO {
    pendingRequests: number;
    averageResolutionHours: number;
    mergedRequests: number;
}

export interface AdminDashboardNotificationsDTO {
    pendingModels: number;
    reportedAds: number;
    pendingBusinesses: number;
    pendingAds: number;
}

export interface AdminDashboardStatsDTO {
    totalUsers: number;
    totalAds: number;
    activeAds: number;
    pendingAds: number;
    totalServices: number;
    activeServices: number;
    pendingServices: number;
    rejectedServices?: number;
    totalSpareParts: number;
    activeSpareParts: number;
    pendingSpareParts: number;
    notifications?: AdminDashboardNotificationsDTO;
    revenue?: number;
    catalogHealth?: CatalogHealthMetricsDTO;
}
