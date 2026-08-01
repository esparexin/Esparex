import { CreatedListing } from '../../domain/CreatedListing';

/**
 * CreatedListingResponseDto — strongly typed contract for backend creation responses.
 */
export interface CreatedListingResponseDto {
  id: string | number;
  slug?: string;
  status?: string;
  moderationStatus?: string;
}

/**
 * CreatedListingMapper — pure mapper transforming raw API DTO responses into CreatedListing domain value objects.
 *
 * Single responsibility: API DTO → Domain transformation for creation responses without compiler bypasses.
 */
export class CreatedListingMapper {
  public static fromDto(dto: CreatedListingResponseDto): CreatedListing {
    return {
      id: String(dto.id),
      slug: dto.slug || undefined,
      moderationStatus: dto.status || dto.moderationStatus || undefined,
    };
  }
}
