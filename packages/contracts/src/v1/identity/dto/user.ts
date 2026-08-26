import type { UserStatusValue } from '../enums/userStatus';
import type { MobileVisibilityValue } from '../../common/constants/mobileVisibility';
import type { BusinessStatusValue } from '../../businesses/enums/businessStatus';
export type UserRole = string;

export type UserBusinessStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'active' | 'deleted' | 'closed' | 'live' | 'deactivated' | 'expired' | 'none' | (string & {});

export interface UserNotificationSettings {
    enabled?: boolean;
    instantAlerts?: boolean;
    // Legacy fallbacks supported during transition
    adUpdates?: boolean;
    promotions?: boolean;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
}

export interface User {
    id: string; // Unified ID field
    role: UserRole;
    mobile: string;
    mobileVisibility?: MobileVisibilityValue;
    businessStatus?: UserBusinessStatus;
    businessName?: string;
    isPhoneVerified: boolean;
    isVerified?: boolean;

    name?: string;
    profilePhoto?: string;
    email?: string;
    billingEmail?: string;
    gstin?: string;
    gstDetails?: {
        legalName?: string;
        tradeName?: string;
        stateCode?: string;
        isVerified?: boolean;
    };
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
