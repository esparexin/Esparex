import type { UserStatusValue } from '../enums/userStatus';
import type { MobileVisibilityValue } from '../../common/constants/mobileVisibility';
export type UserRole = string;

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
    id: string; // Unified ID field
    role: UserRole;
    mobile: string;
    mobileVisibility?: MobileVisibilityValue;
    businessStatus?: any;
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

    // Location Sync
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
