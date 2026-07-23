import type { Ad as SchemaAd } from '../schema/ad.schema';

/**
 * Convenience alias for location payload carried by Ad.
 * Note: Ad type is exported directly from listings/schema — import from there.
 */
export type AdLocation = SchemaAd["location"];

export interface PresignedUploadResult {
    uploadUrl: string;
    publicUrl: string;
    key: string;
    expiresIn: number;
}


