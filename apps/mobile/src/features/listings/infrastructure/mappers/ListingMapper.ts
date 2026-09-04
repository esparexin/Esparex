import type { Ad } from '@esparex/contracts/src/v1/listings/schema/ad.schema';
import { Listing } from '../../domain/Listing';
import { normalizeImageUrl } from '../../../../infrastructure/image/imageUrl';

/**
 * ListingMapper — pure infrastructure mapper transforming raw Ad DTO objects into Listing domain models.
 */
const HTML_ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};

const HTML_ENTITY_REGEX = /&(?:amp|lt|gt|quot|#39);/g;

function unescapeHtml(text: string): string {
  return text.replace(HTML_ENTITY_REGEX, (entity) => HTML_ENTITY_MAP[entity] ?? entity);
}

export class ListingMapper {
  private static resolveCondition(rawAd: Ad): 'power_on' | 'power_off' | undefined {
    const adRecord = rawAd as Record<string, unknown>;
    const raw =
      (typeof adRecord.deviceCondition === 'string' ? adRecord.deviceCondition : undefined) ||
      (typeof adRecord.condition === 'string' ? adRecord.condition : undefined) ||
      (adRecord.specs && typeof adRecord.specs === 'object'
        ? ((adRecord.specs as Record<string, unknown>).deviceCondition as string | undefined) ||
          ((adRecord.specs as Record<string, unknown>).condition as string | undefined)
        : undefined);

    if (typeof raw === 'string' && raw.trim()) {
      const norm = raw.toLowerCase().trim().replace(/[\s_-]+/g, '_');
      if (norm.includes('power_on') || norm.includes('powers_on') || norm === 'working') {
        return 'power_on';
      }
      if (norm.includes('power_off') || norm.includes('powers_off') || norm === 'dead') {
        return 'power_off';
      }
    }

    // Fallback title parsing
    const title = typeof rawAd.title === 'string' ? rawAd.title.toLowerCase() : '';
    if (
      title.includes('powers on') ||
      title.includes('power on') ||
      title.includes('(power on)') ||
      title.includes('- power on')
    ) {
      return 'power_on';
    }
    if (
      title.includes('powers off') ||
      title.includes('power off') ||
      title.includes('(power off)') ||
      title.includes('- power off')
    ) {
      return 'power_off';
    }

    return undefined;
  }

  public static mapAdToListing(ad: Ad): Listing {
    const cleanTitle = unescapeHtml(ad.title || 'Untitled');

    const sellerName = ad.sellerName || ad.businessName || 'Seller';
    const priceAmount = typeof ad.price === 'number' ? ad.price : 0;
    const formattedPrice =
      priceAmount === 0 ? 'Free' : `₹${priceAmount.toLocaleString('en-IN')}`;

    const mappedSpareParts = Array.isArray(ad.sparePartsSnapshot) && ad.sparePartsSnapshot.length > 0
      ? ad.sparePartsSnapshot.map((part) => ({
          id: String(part._id || part.id || ''),
          name: String(part.name || ''),
          brand: part.brand ? String(part.brand) : undefined,
        }))
      : Array.isArray(ad.spareParts) && ad.spareParts.length > 0
      ? ad.spareParts
          .map((part) => {
            if (typeof part === 'string') {
              return { id: part, name: part };
            }
            if (part && typeof part === 'object') {
              const p = part as Record<string, unknown>;
              return {
                id: String(p._id || p.id || ''),
                name: String(p.name || ''),
                brand: typeof p.brand === 'string' ? p.brand : undefined,
              };
            }
            return null;
          })
          .filter((p): p is { id: string; name: string; brand?: string } => p !== null && Boolean(p.name))
      : undefined;

    return {
      id: String(ad.id),
      title: cleanTitle,
      description: unescapeHtml(ad.description || ''),
      price: {
        amount: priceAmount,
        currency: 'INR',
        formatted: formattedPrice,
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
            locationId: ad.location.locationId ? String(ad.location.locationId) : undefined,
          }
        : undefined,
      status: ad.status || 'draft',
      createdAt: new Date(ad.createdAt || Date.now()),
      updatedAt: ad.updatedAt ? new Date(ad.updatedAt) : undefined,
      category: ad.categoryName || ad.category,
      categoryId: ad.categoryId ? String(ad.categoryId) : undefined,
      condition: ListingMapper.resolveCondition(ad),
      spareParts: mappedSpareParts,
      isFeatured: !!ad.isFeatured,
      isSpotlight: Boolean(
        ad.isSpotlight ||
          (ad as Record<string, unknown>).spotlight ||
          (ad as Record<string, unknown>).planType === 'SPOTLIGHT' ||
          (ad as Record<string, unknown>).promotionType === 'SPOTLIGHT' ||
          (ad.spotlightExpiresAt && new Date(ad.spotlightExpiresAt).getTime() > Date.now())
      ),
      isPremium: !!ad.isPremium,
    };
  }
}
