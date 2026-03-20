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
    coordinates: {
        type: 'Point';
        coordinates: [number, number]; // [lng, lat]
    };
}

export interface BusinessDocument {
    type: 'id_proof' | 'business_proof' | 'certificate';
    url: string;
    uploadedAt: string;
    expiryDate?: string;
    version: number;
}

import { BusinessStatusValue } from '../enums/businessStatus';

export type BusinessStatus = BusinessStatusValue;

export interface Business {
    id: string; // Unified ID field
    
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
    
    /** @deprecated Use sellerId */
    userId?: string;
    /** @deprecated Use sellerId */
    ownerId?: string;

    name: string;
    slug?: string;
    description?: string;
    mobile: string;
    phone?: string; // Kept for legacy compatibility
    email: string;
    website?: string;
    gstNumber?: string;
    registrationNumber?: string;
    businessTypes: string[];
    
    deviceCategories: string[] | Array<{
        category: string;
        services: boolean;
        spareParts: boolean;
        isLocked: boolean;
    }>;
    deviceCategoryIds?: string[];
    
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
        businessProof?: string[];
        /** @deprecated Use canonical array filtering */
        certificates?: string[];
    };
    
    status: BusinessStatus;
    rejectionReason?: string;
    trustScore: number;
    
    isVerified: boolean;
    /** @deprecated Use isVerified */
    verified: boolean;

    approvedAt?: string;
    expiresAt?: string;
    createdAt: string;
    updatedAt?: string;
    isDeleted?: boolean;
    deletedAt?: string;

    // Derived UI / Compatibility Aliases
    businessName?: string;
    ownerName?: string;
    tagline?: string;
    contactNumber?: string; // Standard alias for 'mobile'
    whatsappNumber?: string;
    businessType?: string; // Standard alias for 'businessTypes[0]'
    shopImages?: string[]; // Standard alias for 'images'
    gallery?: string[]; // Standard alias for 'images'
    logo?: string;
    coverImage?: string;
    rating?: number;
    totalReviews?: number;
}
