import type { IdProofTypeValue } from '../enums/idProofType';
import { BusinessStatusValue } from '../enums/businessStatus';
export interface BusinessLocation {
    id?: string;
    locationId?: string;
    formattedAddress?: string;
    address: string;
    display?: string;
    shopNo?: string;
    street?: string;
    landmark?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    coordinates?: {
        type: 'Point';
        coordinates: [number, number];
    };
}
export interface BusinessDocument {
    type: 'id_proof' | 'business_proof' | 'certificate';
    url: string;
    uploadedAt: string;
    expiryDate?: string;
    version: number;
    idProofType?: IdProofTypeValue;
}
export type BusinessStatus = BusinessStatusValue;
export interface Business {
    id: string;
    /**
     * Canonical Ownership Key
     * SSOT: Standardized on 'sellerId' across all entities (Ads, Businesses, Services).
     */
    sellerId: string | {
        id?: string;
        _id?: string;
        name?: string;
        email?: string;
        mobile?: string;
    };
    name: string;
    slug?: string;
    description?: string;
    mobile: string;
    email: string;
    website?: string;
    gstNumber?: string;
    registrationNumber?: string;
    businessTypes: string[];
    locationId?: string;
    location: BusinessLocation;
    workingHours?: unknown;
    images?: string[];
    /**
     * Canonical Documents Structure
     * SSOT: Array of BusinessDocument objects.
     * Includes compatibility aliases for legacy UI components.
     */
    documents: BusinessDocument[] & {
        /** @deprecated Use canonical array filtering */
        idProof?: string[];
        /** @deprecated Use canonical array filtering */
        idProofType?: IdProofTypeValue;
        /** @deprecated Use canonical array filtering */
        businessProof?: string[];
        /** @deprecated Use canonical array filtering */
        certificates?: string[];
    };
    status: BusinessStatus;
    rejectionReason?: string;
    trustScore: number;
    isVerified: boolean;
    approvedAt?: string;
    expiresAt?: string;
    createdAt: string;
    updatedAt?: string;
    isDeleted?: boolean;
    deletedAt?: string;
    businessName?: string;
    ownerName?: string;
    tagline?: string;
    contactNumber?: string;
    whatsappNumber?: string;
    businessType?: string;
    shopImages?: string[];
    gallery?: string[];
    logo?: string;
    coverImage?: string;
    rating?: number;
    totalReviews?: number;
    distanceKm?: number;
    activeServicesCount?: number;
    matchingServicesCount?: number;
}
//# sourceMappingURL=Business.d.ts.map