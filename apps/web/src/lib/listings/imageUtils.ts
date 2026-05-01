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
export const LISTING_IMAGE_COMPRESSION_OPTIONS = {
    maxSizeMB: 4.5,
    maxWidthOrHeight: 1920,
    useWebWorker: false,
};
