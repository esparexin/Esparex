import { CreatedListingResponseDto } from '@esparex/contracts';
import { CreatedListingMapper } from '../CreatedListingMapper';

describe('CreatedListingMapper', () => {
  it('maps a complete CreatedListingResponseDto into a CreatedListing domain entity', () => {
    const dto: CreatedListingResponseDto = {
      id: 'ad-101',
      slug: 'iphone-13-mumbai',
      status: 'pending',
      moderationStatus: 'pending_review',
    };

    const domain = CreatedListingMapper.fromDto(dto);

    expect(domain).toBeDefined();
    expect(domain.id).toBe('ad-101');
    expect(domain.slug).toBe('iphone-13-mumbai');
    expect(domain.moderationStatus).toBe('pending');
  });

  it('coerces numeric id to string', () => {
    const dto: CreatedListingResponseDto = {
      id: 99482,
      slug: 'item-99482',
    };

    const domain = CreatedListingMapper.fromDto(dto);

    expect(domain.id).toBe('99482');
    expect(domain.slug).toBe('item-99482');
  });

  it('falls back to moderationStatus when status is undefined', () => {
    const dto: CreatedListingResponseDto = {
      id: 'ad-202',
      moderationStatus: 'approved',
    };

    const domain = CreatedListingMapper.fromDto(dto);

    expect(domain.id).toBe('ad-202');
    expect(domain.moderationStatus).toBe('approved');
    expect(domain.slug).toBeUndefined();
  });

  it('handles empty/undefined optional fields gracefully', () => {
    const dto: CreatedListingResponseDto = {
      id: 'ad-303',
    };

    const domain = CreatedListingMapper.fromDto(dto);

    expect(domain.id).toBe('ad-303');
    expect(domain.slug).toBeUndefined();
    expect(domain.moderationStatus).toBeUndefined();
  });
});
