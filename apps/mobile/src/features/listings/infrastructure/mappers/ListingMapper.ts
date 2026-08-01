import type { Ad } from '@esparex/contracts/src/v1/listings/schema/ad.schema';
import { Listing } from '../../domain/Listing';

/**
 * ListingMapper — pure infrastructure mapper transforming raw Ad DTO objects into Listing domain models.
 */
export class ListingMapper {
  public static mapAdToListing(ad: Ad): Listing {
    return {
      id: String(ad.id),
      title: ad.title || 'Untitled',
      description: ad.description || '',
      price: {
        amount: ad.price || 0,
        currency: 'USD',
        formatted: `$${(ad.price || 0).toLocaleString()}`,
      },
      seller: {
        id: ad.sellerId || '',
        name: ad.sellerName || 'Unknown Seller',
        type: ad.sellerType === 'business' ? 'business' : 'user',
        isVerified: !!ad.verified,
      },
      images: (ad.images || []).map((img, index) => ({
        url: img,
        isPrimary: index === 0,
      })),
      location: ad.location
        ? {
            city: ad.location.city,
            state: ad.location.state,
            display:
              ad.location.display ||
              [ad.location.city, ad.location.state].filter(Boolean).join(', '),
          }
        : undefined,
      status: ad.status || 'draft',
      createdAt: new Date(ad.createdAt || Date.now()),
      updatedAt: ad.updatedAt ? new Date(ad.updatedAt) : undefined,
      category: ad.categoryName || ad.category,
      isFeatured: !!ad.isFeatured,
      isPremium: !!ad.isPremium,
    };
  }
}
