/**
 * Esparex Daily Marketplace Activity Engine - Types & Schemas
 * Authoritative type definitions for daily marketplace ops
 */

export interface ManifestImageVerification {
    url: string;
    status: 'verified' | 'unreachable' | 'duplicate';
    statusCode?: number;
}

export interface ManifestBusinessInput {
    code: string;
    name: string;
    publicMobile: string; // Shop's public telephone number (NEVER authenticated)
    address: string;
    pincode: string;
    district: string;
    mandal: string;
    city: string;
    state: 'Andhra Pradesh' | 'Telangana';
    categoryId: string;
    images: string[]; // At least 1 mandatory image, remaining optional
    referenceSource: string; // Manual GBP verification reference
    curatorEmail?: string; // Authorized operator email
}

export interface ManifestAdInput {
    code: string;
    title: string;
    description: string;
    price: number;
    categoryId: string;
    brandId: string;
    modelId?: string;
    locationName: string;
    state: 'Andhra Pradesh' | 'Telangana';
    deviceCondition: 'power_on' | 'power_off';
    images: string[]; // At least 1 mandatory image, remaining optional
    referenceSource: string;
}

export interface ManifestServiceInput {
    code: string;
    businessCode: string; // References ManifestBusinessInput.code
    title: string;
    description: string;
    priceMin: number;
    priceMax: number;
    diagnosticFee?: number;
    categoryId: string;
    serviceTypeId: string;
    images: string[]; // At least 1 mandatory image, remaining optional
}

export interface ManifestSparePartInput {
    code: string;
    businessCode: string; // References ManifestBusinessInput.code
    title: string;
    description: string;
    price: number;
    categoryId: string;
    sparePartId: string;
    images: string[]; // At least 1 mandatory image, remaining optional
}

export interface ManifestSmartAlertInput {
    code: string;
    name: string;
    locationName: string;
    state: 'Andhra Pradesh' | 'Telangana';
    radiusKm: number;
    categoryId: string;
    brandId?: string;
}

export interface DailyManifestInput {
    date: string;
    environment: 'development' | 'staging' | 'production';
    curatorName: string;
    curatorMobile: string; // Authorized operator account for authenticated mutations
    businesses: ManifestBusinessInput[];
    ads: ManifestAdInput[];
    services: ManifestServiceInput[];
    spareParts: ManifestSparePartInput[];
    smartAlerts: ManifestSmartAlertInput[];
}

export interface ValidationItemResult {
    code: string;
    type: 'business' | 'ad' | 'service' | 'spare_part' | 'smart_alert';
    nameOrTitle: string;
    isValid: boolean;
    rejectionReason?: string;
    resolvedLocationId?: string;
    resolvedCoordinates?: [number, number];
    imageCount: number;
}

export interface DailyExecutionManifest {
    date: string;
    environment: string;
    targets: {
        ads: number;
        businesses: number;
        services: number;
        spareParts: number;
        smartAlerts: number;
        total: number;
    };
    verified: {
        ads: number;
        businesses: number;
        services: number;
        spareParts: number;
        smartAlerts: number;
        total: number;
    };
    rejected: {
        ads: number;
        businesses: number;
        services: number;
        spareParts: number;
        smartAlerts: number;
        total: number;
    };
    shortages: {
        ads: number;
        businesses: number;
        services: number;
        spareParts: number;
        smartAlerts: number;
        total: number;
        reasons: string[];
    };
    createdSummary: {
        ads: number;
        businesses: number;
        services: number;
        spareParts: number;
        smartAlerts: number;
        total: number;
    };
    results: ValidationItemResult[];
}
