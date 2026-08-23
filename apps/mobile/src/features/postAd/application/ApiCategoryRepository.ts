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
    const response = await apiClient.get<PaginatedResponse<CategoryDto> | CategoryDto[]>('/catalog/categories');
    const resData = response.data as {
      data?: { items?: CategoryDto[] } | CategoryDto[];
      items?: CategoryDto[];
    } | CategoryDto[];

    let items: CategoryDto[] = [];
    if (Array.isArray(resData)) {
      items = resData;
    } else if (resData && typeof resData === 'object') {
      if ('data' in resData && resData.data) {
        if (Array.isArray(resData.data)) {
          items = resData.data;
        } else if ('items' in resData.data && Array.isArray(resData.data.items)) {
          items = resData.data.items;
        }
      } else if ('items' in resData && Array.isArray(resData.items)) {
        items = resData.items;
      }
    }

    return items.map((item: CategoryDto) => ({
      id: item.id || item._id || item.slug || item.name,
      name: item.name,
      icon: item.icon || 'Package',
    }));
  }
}
