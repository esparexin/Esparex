import { CreateListingRequestMapper } from '../CreateListingRequestMapper';
import { PostAdDraft } from '../../../domain/PostAdDraft';
import { UploadedImage } from '../../../domain/UploadedImage';

describe('CreateListingRequestMapper', () => {
  const sampleDraft: PostAdDraft = {
    title: 'Apple MacBook Pro M2',
    description: '16GB RAM 512GB SSD Space Gray working laptop.',
    price: 145000,
    isFree: false,
    categoryId: '60d5ec49f1b2c8a1e4a1b2c1',
    brandId: '60d5ec49f1b2c8a1e4a1b2c2',
    modelId: '60d5ec49f1b2c8a1e4a1b2c3',
    deviceCondition: 'power_on',
    spareParts: ['60d5ec49f1b2c8a1e4a1b2c4', '60d5ec49f1b2c8a1e4a1b2c5'],
    location: {
      locationId: 'loc-100',
      city: 'Bengaluru',
      state: 'Karnataka',
      coordinates: { type: 'Point', coordinates: [77.5946, 12.9716] },
      display: 'Indiranagar, Bengaluru, Karnataka',
    },
    locationId: 'loc-100',
    locationDisplay: 'Indiranagar, Bengaluru, Karnataka',
  };

  const sampleImages: UploadedImage[] = [
    {
      key: 'ads/img1.jpg',
      url: 'https://storage.esparex.in/ads/img1.jpg',
    },
  ];

  it('maps complete draft and uploaded images into a valid CreateListingRequest DTO', () => {
    const dto = CreateListingRequestMapper.fromDraft(sampleDraft, sampleImages);

    expect(dto).toBeDefined();
    expect(dto.title).toBe('Apple MacBook Pro M2');
    expect(dto.description).toBe('16GB RAM 512GB SSD Space Gray working laptop.');
    expect(dto.price).toBe(145000);
    expect(dto.isFree).toBe(false);
    expect(dto.categoryId).toBe('60d5ec49f1b2c8a1e4a1b2c1');
    expect(dto.brandId).toBe('60d5ec49f1b2c8a1e4a1b2c2');
    expect(dto.modelId).toBe('60d5ec49f1b2c8a1e4a1b2c3');
    expect(dto.deviceCondition).toBe('power_on');
    expect(dto.spareParts).toEqual(['60d5ec49f1b2c8a1e4a1b2c4', '60d5ec49f1b2c8a1e4a1b2c5']);
    expect(dto.location?.city).toBe('Bengaluru');
    expect(dto.imageKeys).toEqual(['ads/img1.jpg']);
  });

  it('handles free items with price 0', () => {
    const freeDraft: PostAdDraft = {
      title: 'Free Old Monitors',
      description: 'Free CRT monitors for spare parts or donation.',
      price: 0,
      isFree: true,
      categoryId: 'cat-monitors',
    };

    const dto = CreateListingRequestMapper.fromDraft(freeDraft, []);

    expect(dto.title).toBe('Free Old Monitors');
    expect(dto.price).toBe(0);
    expect(dto.isFree).toBe(true);
    expect(dto.imageKeys).toEqual([]);
  });
});
