/**
 * CategoryOption — domain model for category selection options.
 *
 * Owned by the postAd domain layer so repositories, services, hooks,
 * and presentation components depend on a single authoritative type.
 */
export interface CategoryOption {
  id: string;
  name: string;
  icon?: string;
}
