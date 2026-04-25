import type { IAd } from '@core/models/Ad';
import type { Document } from 'mongoose';
import AdModel from '@core/models/Ad';
import { generateUniqueSlug } from '@core/utils/slugGenerator';

export async function saveSparePartListing(listing: IAd & Document): Promise<IAd & Document> {
    return listing.save();
}

export async function generateUniqueSparePartSlug(title: string, listingId?: string): Promise<string> {
    return generateUniqueSlug(AdModel, title, listingId);
}
