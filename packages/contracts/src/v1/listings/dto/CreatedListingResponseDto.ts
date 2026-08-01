/**
 * CreatedListingResponseDto — strongly typed contract for backend creation responses.
 */
export interface CreatedListingResponseDto {
  id: string | number;
  slug?: string;
  status?: string;
  moderationStatus?: string;
}
