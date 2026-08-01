import { CreateListingRequestMapper } from '../CreateListingRequestMapper';
import { PostAdDraft } from '../../../domain/PostAdDraft';
import { UploadedImage } from '../../../domain/UploadedImage';

describe('CreateListingRequestMapper', () => {
  const sampleDraft: PostAdDraft = {
    title: 'Test Listing',
    description: 'This is a test description for a mobile listing.',
    price: 1500,
    categoryId: 'cat-electronics',
    condition: 'used_good',
    locationId: 'loc-mumbai-1',
    locationDisplay: 'Mumbai, Maharashtra',
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
    expect(dto.title).toBe('Test Listing');
    expect(dto.description).toBe('This is a test description for a mobile listing.');
    expect(dto.price).toBe(1500);
    expect(dto.categoryId).toBe('cat-electronics');
    expect(dto.condition).toBe('used_good');
    expect(dto.locationId).toBe('loc-mumbai-1');
    expect(dto.locationDisplay).toBe('Mumbai, Maharashtra');
    expect(dto.imageKeys).toEqual(['ads/img1.jpg']);
  });

  it('handles empty images array and optional fields safely', () => {
    const minimalDraft: PostAdDraft = {
      title: 'Minimal Item',
      description: 'Minimal description.',
      price: 0,
      categoryId: 'cat-tools',
    };

    const dto = CreateListingRequestMapper.fromDraft(minimalDraft, []);

    expect(dto.title).toBe('Minimal Item');
    expect(dto.imageKeys).toEqual([]);
    expect(dto.condition).toBeUndefined();
    expect(dto.locationId).toBeUndefined();
    expect(dto.locationDisplay).toBeUndefined();
  });
});
