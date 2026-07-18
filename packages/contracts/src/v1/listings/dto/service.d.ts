import type { GeoJSONPoint } from './location';
import { ServiceStatusValue } from '../enums/serviceStatus';
export type ServiceStatus = ServiceStatusValue;
export interface Service {
    id: string;
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
    title: string;
    deviceType: string;
    categoryId: string | {
        id?: string;
        name?: string;
        icon?: string;
    };
    brandId?: string | {
        id?: string;
        name?: string;
    };
    modelId?: string | {
        id?: string;
        name?: string;
    };
    locationId: string | {
        id?: string;
        name?: string;
        city?: string;
        state?: string;
        country?: string;
        address?: string;
        coordinates?: GeoJSONPoint;
    };
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
        coordinates?: GeoJSONPoint;
    };
    serviceTypeIds?: string[];
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
    approvedAt?: string;
    createdAt: string;
    updatedAt: string;
    name?: string;
    price?: number;
    category?: string | {
        id?: string;
        _id?: string;
        name?: string;
        [key: string]: unknown;
    } | null;
    user?: string | {
        id?: string;
        _id?: string;
        name?: string;
        mobile?: string;
        [key: string]: unknown;
    } | null;
}
