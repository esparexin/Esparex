import { apiClient } from '../../lib/api/client';
import { toApiResult } from '@/lib/api/result';
import { API_ROUTES } from '../routes';
import { toSafeImageArray } from '@/lib/image/imageUrl';

export interface SparePartListing {
    id: string;
    title: string;
    description: string;
    price: number;
    categoryId: string | { id: string; name: string; slug: string };
    sparePartId: string | { id: string; name: string; slug: string };
    compatibleModels?: Array<string | { id: string; name: string; slug: string }>;
    brandId?: string;
    images: string[];
    status: string;
    seoSlug: string;
    sellerBusinessId: string | object;
    location?: {
        city?: string;
        state?: string;
        display?: string;
    };
    createdAt: string;
}

type SparePartListingPayload = Record<string, unknown>;

const normalizeSparePartListing = (listing: SparePartListing): SparePartListing => ({
    ...listing,
    images: toSafeImageArray(listing.images),
});

export const createSparePartListing = async (
    data: SparePartListingPayload
): Promise<SparePartListing | null> => {
    const { data: listing } = await toApiResult<SparePartListing>(
        apiClient.post(API_ROUTES.USER.SPARE_PART_LISTINGS, data)
    );
    return listing ? normalizeSparePartListing(listing) : null;
};

export const getMySparePartListings = async (): Promise<SparePartListing[]> => {
    const { data: res } = await toApiResult<SparePartListing[]>(
        apiClient.get(API_ROUTES.USER.MY_SPARE_PART_LISTINGS)
    );
    return Array.isArray(res) ? res.map(normalizeSparePartListing) : [];
};

export const getSparePartListingDetail = async (
    id: string
): Promise<SparePartListing | null> => {
    const { data: listing } = await toApiResult<SparePartListing>(
        apiClient.get(API_ROUTES.USER.SPARE_PART_LISTING_DETAIL(id))
    );
    return listing ? normalizeSparePartListing(listing) : null;
};
