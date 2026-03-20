export interface QualityScorePayload {
    title?: string;
    description?: string;
    images?: string[];
    brandId?: unknown;
    price?: number;
    location?: {
        coordinates?: unknown;
    };
}

export const computeListingQualityScore = (payload: QualityScorePayload): number => {
    let qualityScore = 0;
    if (payload.title && payload.title.length >= 15) qualityScore += 15;
    if (payload.title && payload.title.length >= 30) qualityScore += 10;
    if (payload.description && payload.description.length >= 100) qualityScore += 15;
    if (payload.description && payload.description.length >= 300) qualityScore += 10;
    if (payload.images && payload.images.length >= 3) qualityScore += 20;
    if (payload.images && payload.images.length >= 6) qualityScore += 10;
    if (payload.brandId) qualityScore += 10;
    if (payload.price && payload.price > 0) qualityScore += 5;
    if (payload.location && payload.location.coordinates) qualityScore += 5;
    
    return Math.min(qualityScore, 100);
};
