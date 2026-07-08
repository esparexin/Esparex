import mongoose from 'mongoose';

export interface HydratedAd {
    _id?: mongoose.Types.ObjectId | string;
    id?: string;
    categoryId?: mongoose.Types.ObjectId | string;
    brandId?: mongoose.Types.ObjectId | string;
    modelId?: mongoose.Types.ObjectId | string;
    sparePartId?: mongoose.Types.ObjectId | string;
    sparePartIds?: (mongoose.Types.ObjectId | string)[];
    serviceTypeIds?: (mongoose.Types.ObjectId | string)[];
    category?: unknown;
    categoryName?: string;
    brand?: unknown;
    brandName?: string;
    model?: unknown;
    modelName?: string;
    sparePart?: unknown;
    spareParts?: unknown[];
    serviceTypes?: unknown[];
    location?: unknown;
}

export type TelemetryAd = Record<string, unknown> & {
    id?: unknown;
    _id?: unknown;
    rankScore?: unknown;
    listingQualityScore?: unknown;
    distanceScore?: unknown;
    freshnessScore?: unknown;
    popularityScore?: unknown;
    sellerTrustSnapshot?: unknown;
};
