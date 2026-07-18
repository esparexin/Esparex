import type { UserStatusValue } from '../enums/userStatus';
export type UserRole = `${Role}`;
export interface UserNotificationSettings {
    newMessages?: boolean;
    adUpdates?: boolean;
    promotions?: boolean;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    dailyDigest?: boolean;
    instantAlerts?: boolean;
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    marketing?: boolean;
}
export interface User {
    id: string;
    role: UserRole;
    mobile: string;
    businessStatus?: BusinessStatus;
    isPhoneVerified: boolean;
    isVerified?: boolean;
    name?: string;
    profilePhoto?: string;
    email?: string;
    businessId?: string;
    isEmailVerified?: boolean;
    userType?: 'user' | 'business';
    status?: UserStatusValue | 'active';
    statusReason?: string;
    totalAds?: number;
    createdAt?: string;
    updatedAt?: string;
    notificationSettings?: UserNotificationSettings;
    locationId?: string;
    location?: {
        id?: string;
        city: string;
        state?: string;
        coordinates?: {
            type: 'Point';
            coordinates: [number, number];
        };
    };
}
