/**
 * Duplicate Image Service (PR 3 — Stage 1 Processing)
 *
 * Computes 64-bit difference perceptual image hashes (dhash) using sharp
 * to detect duplicate, re-scaled, or slightly modified image re-uploads
 * locally at zero API cost.
 */
import sharp from 'sharp';
import logger from '../../../utils/logger';

export interface ImageFingerprint {
    hash: string;
    createdAt: number;
}

export class DuplicateImageService {
    /**
     * Computes a 64-bit perceptual difference hash (dhash) for an image buffer.
     * Resizes to 9x8 grayscale, compares adjacent pixel intensities.
     */
    async computeFingerprint(buffer: Buffer): Promise<ImageFingerprint> {
        try {
            // Resize image to 9x8 grayscale raw pixels
            const { data } = await sharp(buffer)
                .resize(9, 8, { fit: 'fill' })
                .grayscale()
                .raw()
                .toBuffer({ resolveWithObject: true });

            let hashBits = '';
            // Compare adjacent horizontal pixels (8 comparisons per row x 8 rows = 64 bits)
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    const leftPixel = data[row * 9 + col];
                    const rightPixel = data[row * 9 + col + 1];
                    hashBits += leftPixel > rightPixel ? '1' : '0';
                }
            }

            // Convert 64-bit binary string to 16-character hexadecimal hash
            let hexHash = '';
            for (let i = 0; i < 64; i += 4) {
                const nibble = hashBits.substring(i, i + 4);
                hexHash += parseInt(nibble, 2).toString(16);
            }

            return {
                hash: hexHash.padStart(16, '0'),
                createdAt: Date.now(),
            };
        } catch (error) {
            logger.warn('[DuplicateImageService] Failed to compute image fingerprint', { error });
            // Fallback hash when processing non-image buffers
            return {
                hash: '0000000000000000',
                createdAt: Date.now(),
            };
        }
    }

    /**
     * Computes Hamming distance (bit difference count) between two hexadecimal 64-bit hash strings.
     */
    hammingDistance(hash1: string, hash2: string): number {
        if (!hash1 || !hash2 || hash1.length !== hash2.length) {
            return 64; // Maximum distance for invalid/mismatched hashes
        }

        let distance = 0;
        for (let i = 0; i < hash1.length; i++) {
            const val1 = parseInt(hash1[i], 16);
            const val2 = parseInt(hash2[i], 16);
            let xor = val1 ^ val2;
            while (xor > 0) {
                distance += xor & 1;
                xor >>= 1;
            }
        }
        return distance;
    }

    /**
     * Determines whether two image fingerprints represent duplicate images.
     * @param threshold Max Hamming distance to consider as duplicate (default 5 bits out of 64).
     */
    isDuplicate(fp1: ImageFingerprint, fp2: ImageFingerprint, threshold = 5): boolean {
        if (!fp1 || !fp2 || !fp1.hash || !fp2.hash) {
            return false;
        }
        const dist = this.hammingDistance(fp1.hash, fp2.hash);
        return dist <= threshold;
    }
}
