export interface AdminUser {
    id: string;
    _id?: string;
    email: string;
    username: string;
    role: 'super_admin' | 'admin' | 'moderator' | 'editor' | 'viewer' | 'user_manager' | 'content_moderator' | 'finance_manager' | 'custom';
    name: string;
    permissions?: string[];
    lastLogin?: string;
    isActive?: boolean;
    status?: 'active' | 'inactive';
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
