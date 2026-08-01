import { CategoryOption } from '../domain/CategoryOption';

/**
 * ICategoryRepository — stable interface for category data access.
 *
 * Application services depend on this interface, enabling concrete
 * storage or network adapters (ApiCategoryRepository) to be swapped
 * without affecting domain services or UI components.
 */
export interface ICategoryRepository {
  /**
   * Fetches category options from the backend catalog.
   *
   * @returns Readonly array of CategoryOption domain models.
   */
  getCategories(): Promise<readonly CategoryOption[]>;
}
