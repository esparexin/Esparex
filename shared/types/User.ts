import { Role } from '../enums/roles';
export type UserRole = `${Role}`;
export type { BusinessStatus } from './Business';
import { BusinessStatus } from './Business';


export interface User {
    id: string; // Unified ID field
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
    status?: 'active' | 'suspended' | 'banned' | 'deleted';
    statusReason?: string;
    totalAds?: number;

    createdAt?: string;
    updatedAt?: string;

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
