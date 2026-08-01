import { ICategoryRepository } from './ICategoryRepository';
import { CategoryOption } from '../domain/CategoryOption';
import { apiClient } from '../../../infrastructure/api/apiClient';

interface CategoryDto {
  id?: string;
  _id?: string;
  name: string;
  slug?: string;
  icon?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta?: {
    total: number;
    page: number;
  };
}

/**
 * ApiCategoryRepository — concrete HTTP implementation of ICategoryRepository.
 *
 * Calls GET /v1/categories via apiClient and maps raw DTO objects to domain
 * CategoryOption models. Accurately reflects backend responses without manufacturing fake data.
 */
export class ApiCategoryRepository implements ICategoryRepository {
  public async getCategories(): Promise<readonly CategoryOption[]> {
    const response = await apiClient.get<PaginatedResponse<CategoryDto>>('/v1/categories');
    const items = Array.isArray(response.data?.data) ? response.data.data : [];

    return items.map((item) => ({
      id: item.id || item._id || item.slug || item.name,
      name: item.name,
      icon: item.icon || 'Package',
    }));
  }
}
