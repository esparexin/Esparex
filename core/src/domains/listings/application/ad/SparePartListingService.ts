import { getListingRepository } from '../../../../composition/listings';
import { generateUniqueSlugWithChecker } from '../../../../utils/slugGenerator';


export async function generateUniqueSparePartSlug(title: string, listingId?: string): Promise<string> {
    return generateUniqueSlugWithChecker(
        title,
        async (candidate) => {
            const count = await getListingRepository().count({ seoSlug: candidate, idsNotIn: listingId ? [listingId] : undefined });
            return count > 0;
        },
        listingId
    );
}
