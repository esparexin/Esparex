export interface AdminUser {
    id: string;
    _id?: string;
    email: string;
    username: string; // Often mapped from email or name
    role: 'super_admin' | 'admin' | 'moderator' | 'editor' | 'viewer' | 'user_manager' | 'content_moderator' | 'finance_manager' | 'custom';
    name: string; // Unified display name (required by frontend)
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
    pendingServices: number; // Added pendingServices
    pendingBusinesses: number;
    activeServices?: number; // Added for dashboard
    totalServices?: number; // Added for dashboard
}
