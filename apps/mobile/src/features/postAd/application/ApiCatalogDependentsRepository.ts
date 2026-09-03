import { apiClient } from '../../../infrastructure/api/apiClient';

export interface CatalogBrand {
  id: string;
  name: string;
}

export interface CatalogModel {
  id: string;
  name: string;
}

export interface CatalogSparePart {
  id: string;
  name: string;
  brand?: string;
}

interface ApiItemDto {
  _id?: string;
  id?: string;
  name: string;
  brand?: string;
}

export class ApiCatalogDependentsRepository {
  public static async getBrands(categoryId: string): Promise<CatalogBrand[]> {
    try {
      const response = await apiClient.get<{ data?: ApiItemDto[] } | ApiItemDto[]>(
        `/brands?categoryId=${encodeURIComponent(categoryId)}`
      ).catch(() => ({ data: [] }));

      const raw: ApiItemDto[] = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : [];

      return raw.map((b: ApiItemDto) => ({
        id: b._id || b.id || b.name,
        name: b.name,
      }));
    } catch {
      return [];
    }
  }

  public static async getSpareParts(categoryId: string): Promise<CatalogSparePart[]> {
    try {
      const response = await apiClient.get<{ data?: ApiItemDto[] } | ApiItemDto[]>(
        `/spare-parts?categoryId=${encodeURIComponent(categoryId)}`
      ).catch(() => ({ data: [] }));

      const raw: ApiItemDto[] = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : [];

      return raw.map((p: ApiItemDto) => ({
        id: p._id || p.id || p.name,
        name: p.name,
        brand: p.brand,
      }));
    } catch {
      return [];
    }
  }

  public static async getModels(brandId: string): Promise<CatalogModel[]> {
    try {
      const response = await apiClient.get<{ data?: ApiItemDto[] } | ApiItemDto[]>(
        `/models?brandId=${encodeURIComponent(brandId)}`
      ).catch(() => ({ data: [] }));

      const raw: ApiItemDto[] = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : [];

      return raw.map((m: ApiItemDto) => ({
        id: m._id || m.id || m.name,
        name: m.name,
      }));
    } catch {
      return [];
    }
  }
}
