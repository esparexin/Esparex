import { ListingMapper } from '../ListingMapper';
import type { Ad } from '@esparex/contracts/src/v1/listings/schema/ad.schema';

describe('ListingMapper', () => {
  const createMockAd = (overrides: Partial<Ad> = {}): Ad => ({
    id: 'ad-mock-1',
    title: 'Test Item',
    description: 'Test description',
    price: 100,
    images: [],
    sellerId: 'usr-1',
    sellerName: 'Test Seller',
    status: 'live',
    createdAt: new Date().toISOString(),
    location: {
      city: 'Hyderabad',
      state: 'Telangana',
    },
    ...overrides,
  } as Ad);

  it('formats zero or undefined price as Free', () => {
    const freeAd = createMockAd({
      id: 'ad-0',
      title: 'Free Spare Parts',
      price: 0,
    });

    const listing = ListingMapper.mapAdToListing(freeAd);
    expect(listing.price.amount).toBe(0);
    expect(listing.price.formatted).toBe('Free');
  });

  it('formats positive numeric price with Indian locale currency symbol', () => {
    const paidAd = createMockAd({
      id: 'ad-1',
      title: 'iPhone 13 Screen',
      price: 2500,
    });

    const listing = ListingMapper.mapAdToListing(paidAd);
    expect(listing.price.amount).toBe(2500);
    expect(listing.price.formatted).toBe('₹2,500');
  });

  it('resolves power_on condition from deviceCondition field', () => {
    const ad = createMockAd({
      id: 'ad-2',
      title: 'Dell Inspiron Motherboard',
      price: 1500,
      deviceCondition: 'power_on',
    });

    const listing = ListingMapper.mapAdToListing(ad);
    expect(listing.condition).toBe('power_on');
  });

  it('resolves power_off condition from specs.condition', () => {
    const ad = createMockAd({
      id: 'ad-3',
      title: 'MacBook Air Logic Board',
      price: 3000,
      specs: { condition: 'power_off' },
    });

    const listing = ListingMapper.mapAdToListing(ad);
    expect(listing.condition).toBe('power_off');
  });

  it('resolves power_off condition from title fallback when not in specs', () => {
    const ad = createMockAd({
      id: 'ad-4',
      title: 'Avita Liber V14 Laptop - For Parts/Repair (Power Off)',
      price: 200,
    });

    const listing = ListingMapper.mapAdToListing(ad);
    expect(listing.condition).toBe('power_off');
  });

  it('resolves power_on condition from title fallback', () => {
    const ad = createMockAd({
      id: 'ad-5',
      title: 'Sony WH-1000XM4 (Powers On)',
      price: 1000,
    });

    const listing = ListingMapper.mapAdToListing(ad);
    expect(listing.condition).toBe('power_on');
  });

  it('maps isSpotlight when ad.isSpotlight is true or planType is SPOTLIGHT', () => {
    const spotlightAd = createMockAd({
      id: 'ad-6',
      title: 'Spotlight Drone Spare Part',
      price: 5000,
      isSpotlight: true,
    });

    const listing = ListingMapper.mapAdToListing(spotlightAd);
    expect(listing.isSpotlight).toBe(true);
  });
});
