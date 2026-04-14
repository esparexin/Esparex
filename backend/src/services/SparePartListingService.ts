import type { IAd } from '../models/Ad';
import type { Document } from 'mongoose';

export async function saveSparePartListing(listing: IAd & Document): Promise<IAd & Document> {
    return listing.save();
}
