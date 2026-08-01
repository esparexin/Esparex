/**
 * CreatedListing — immutable domain value object returned by listing repository creation.
 *
 * Encapsulates listing identifiers alongside moderation status, avoiding raw string returns.
 */
export interface CreatedListing {
  readonly id: string;
  readonly slug?: string;
  readonly moderationStatus?: string;
}
