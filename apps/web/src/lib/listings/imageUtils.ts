import { MAX_AD_IMAGE_BYTES } from '@esparex/shared';

/**
 * 🖼️ Image Utilities for Listings
 */

/**
 * Generates a SHA-256 hash of a file for duplicate detection.
 */
export const generateFileHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Standard compression options for listing images.
 */
// ~90% of the hard gate to leave margin for variance
const COMPRESSION_TARGET_MB = (MAX_AD_IMAGE_BYTES / (1024 * 1024)) * 0.9;

export const LISTING_IMAGE_COMPRESSION_OPTIONS = {
    maxSizeMB: COMPRESSION_TARGET_MB,
    maxWidthOrHeight: 1920,
    useWebWorker: false,
};
