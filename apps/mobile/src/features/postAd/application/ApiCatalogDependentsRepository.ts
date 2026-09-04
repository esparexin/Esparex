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

interface CatalogApiResponse {
  success?: boolean;
  data?: ApiItemDto[];
}

export class ApiCatalogDependentsRepository {
  public static async getBrands(categoryId: string): Promise<CatalogBrand[]> {
    try {
      const response = await apiClient.get<CatalogApiResponse | ApiItemDto[]>(
        `/catalog/brands?categoryId=${encodeURIComponent(categoryId)}`
      ).catch(() => ({ data: { data: [] } }));

      const resData = response?.data;
      let raw: ApiItemDto[] = [];
      if (Array.isArray(resData)) {
        raw = resData;
      } else if (resData && typeof resData === 'object' && 'data' in resData && Array.isArray(resData.data)) {
        raw = resData.data;
      } else if (Array.isArray(response)) {
        raw = response;
      }

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
      const response = await apiClient.get<CatalogApiResponse | ApiItemDto[]>(
        `/catalog/spare-parts?categoryId=${encodeURIComponent(categoryId)}`
      ).catch(() => ({ data: { data: [] } }));

      const resData = response?.data;
      let raw: ApiItemDto[] = [];
      if (Array.isArray(resData)) {
        raw = resData;
      } else if (resData && typeof resData === 'object' && 'data' in resData && Array.isArray(resData.data)) {
        raw = resData.data;
      } else if (Array.isArray(response)) {
        raw = response;
      }

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
      const response = await apiClient.get<CatalogApiResponse | ApiItemDto[]>(
        `/catalog/models?brandId=${encodeURIComponent(brandId)}`
      ).catch(() => ({ data: { data: [] } }));

      const resData = response?.data;
      let raw: ApiItemDto[] = [];
      if (Array.isArray(resData)) {
        raw = resData;
      } else if (resData && typeof resData === 'object' && 'data' in resData && Array.isArray(resData.data)) {
        raw = resData.data;
      } else if (Array.isArray(response)) {
        raw = response;
      }

      return raw.map((m: ApiItemDto) => ({
        id: m._id || m.id || m.name,
        name: m.name,
      }));
    } catch {
      return [];
    }
  }
}
