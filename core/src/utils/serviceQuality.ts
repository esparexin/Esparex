/**
 * calculateServiceQuality
 * Computes a quality score (0-100) based on listing completeness and business status.
 * SSOT for service ranking.
 */
export const calculateServiceQuality = (service: Record<string, unknown>, business?: Record<string, unknown>): number => {
    let score = 0;

    // 1. Images (+30)
    if (Array.isArray(service.images) && service.images.length > 0) {
        score += 30;
    }

    // 2. Pricing (+20)
    // If priceMin is set and > 0, it's considered high quality (not just "Get Quote")
    if (service.priceMin && Number(service.priceMin) > 0) {
        score += 20;
    }

    // 3. Title Quality (+15)
    if (typeof service.title === 'string' && service.title.trim().length > 20) {
        score += 15;
    }

    // 4. Description Quality (+20)
    if (typeof service.description === 'string' && service.description.trim().split(/\s+/).length > 20) {
        score += 20;
    }

    // 5. Business Status (+15)
    if (business?.status === 'approved' || business?.isVerified) {
        score += 15;
    }

    return Math.min(100, score);
};
