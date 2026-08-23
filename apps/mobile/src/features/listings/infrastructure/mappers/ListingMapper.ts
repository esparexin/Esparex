import type { Ad } from '@esparex/contracts/src/v1/listings/schema/ad.schema';
import { Listing } from '../../domain/Listing';
import { normalizeImageUrl } from '../../../../infrastructure/image/imageUrl';

/**
 * ListingMapper — pure infrastructure mapper transforming raw Ad DTO objects into Listing domain models.
 */
export class ListingMapper {
  public static mapAdToListing(ad: Ad): Listing {
    const cleanTitle = (ad.title || 'Untitled')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    const sellerName = ad.sellerName || ad.businessName || 'Verified Technician';

    return {
      id: String(ad.id),
      title: cleanTitle,
      description: (ad.description || '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'"),
      price: {
        amount: ad.price || 0,
        currency: 'INR',
        formatted: `₹${(ad.price || 0).toLocaleString('en-IN')}`,
      },
      seller: {
        id: ad.sellerId || '',
        name: sellerName,
        type: ad.sellerType === 'business' || !!ad.businessName ? 'business' : 'user',
        isVerified: !!ad.verified || !!ad.isBusiness,
      },
      images: (ad.images || []).map((img, index) => ({
        url: normalizeImageUrl(img),
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
