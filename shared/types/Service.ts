import type { CanonicalGeoPoint } from './Location';
import { ServiceStatusValue } from '../enums/serviceStatus';

export type ServiceStatus = ServiceStatusValue;

export interface Service {
    id: string; // Unified ID field
    /** 
     * Canonical Ownership Key 
     * SSOT: Standardized on 'sellerId' across all entities.
     */
    sellerId: string | {
        id?: string;
        name?: string;
        firstName?: string;
        lastName?: string;
        businessName?: string;
        businessStatus?: string;
        avatar?: string;
        mobile?: string;
    };
    /** @deprecated Use sellerId */
    userId?: string;
    title: string;
    deviceType: string;
    categoryId: string | { id?: string; name?: string; icon?: string };
    brandId?: string | { id?: string; name?: string };
    modelId?: string | { id?: string; name?: string };
    locationId: string | { id?: string; name?: string; city?: string; state?: string; country?: string; address?: string; coordinates?: CanonicalGeoPoint };
    location?: {
        id?: string;
        locationId?: string;
        name?: string;
        display?: string;
        formattedAddress?: string;
        address?: string;
        city?: string;
        state?: string;
        country?: string;
        pincode?: string;
        coordinates?: CanonicalGeoPoint;
    };
    serviceTypeIds?: string[];
    serviceTypes: string[];
    priceMin?: number;
    priceMax?: number;
    diagnosticFee?: number;
    onsiteService: boolean;
    turnaroundTime: string;
    warranty: string;
    description: string;
    included?: string;
    excluded?: string;
    images: string[];
    status: ServiceStatus;
    rejectionReason?: string;
    approvedAt?: string; // ISO Date
    createdAt: string; // ISO Date
    updatedAt: string; // ISO Date

    // Legacy/compat fields (avoid use in new code)
    name?: string;
    price?: number;
    category?:
    | string
    | {
        id?: string;
        _id?: string;
        name?: string;
        [key: string]: unknown;
    }
    | null;
    user?:
    | string
    | {
        id?: string;
        _id?: string;
        name?: string;
        mobile?: string;
        [key: string]: unknown;
    }
    | null;
}
