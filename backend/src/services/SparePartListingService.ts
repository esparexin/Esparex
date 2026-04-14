import type { IAd } from '../models/Ad';
import type { Document } from 'mongoose';
import AdModel from '../models/Ad';
import { generateUniqueSlug } from '../utils/slugGenerator';

export async function saveSparePartListing(listing: IAd & Document): Promise<IAd & Document> {
    return listing.save();
}

export async function generateUniqueSparePartSlug(title: string, listingId?: string): Promise<string> {
    return generateUniqueSlug(AdModel, title, listingId);
}
