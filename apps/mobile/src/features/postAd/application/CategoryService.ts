import { ICategoryRepository } from './ICategoryRepository';
import { CategoryOption } from '../domain/CategoryOption';

/**
 * CategoryService — application service for category workflows.
 *
 * Encapsulates business orchestration for catalog queries. Dependers (hooks) call this
 * service, isolating presentation from network transport and repository specifics.
 */
export class CategoryService {
  constructor(private readonly repository: ICategoryRepository) {}

  /**
   * Delegates category retrieval directly to the repository interface.
   */
  public getCategories(): Promise<readonly CategoryOption[]> {
    return this.repository.getCategories();
  }
}
