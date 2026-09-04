import { Business } from '@esparex/contracts';
import { apiClient } from '../../../infrastructure/api/apiClient';
import { BusinessFormState } from '../domain/BusinessFormState';
import { IBusinessRepository, NearbyBusinessesParams } from './IBusinessRepository';
import { CreateBusinessRequestMapper } from './mappers/CreateBusinessRequestMapper';
import { UpdateBusinessRequestMapper } from './mappers/UpdateBusinessRequestMapper';

export class ApiBusinessRepository implements IBusinessRepository {
  async getMyBusiness(): Promise<Business | null> {
    try {
      const response = await apiClient.get<{ data: Business }>('/businesses/me');
      return response.data?.data ?? null;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async registerBusiness(state: BusinessFormState): Promise<Business> {
    const payload = CreateBusinessRequestMapper.toPayload(state);
    const response = await apiClient.post<{ data: Business }>('/businesses', payload);
    return response.data.data;
  }

  async updateBusiness(businessId: string, state: Partial<BusinessFormState>): Promise<Business> {
    const payload = UpdateBusinessRequestMapper.toPayload(state);
    const response = await apiClient.patch<{ data: Business }>(`/businesses/${businessId}`, payload);
    return response.data.data;
  }

  async uploadDocument(uri: string, fileType: string): Promise<string> {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'upload.jpg';
    
    // Attach file matching backend multer 'file' field
    (formData as { append: (name: string, val: unknown) => void }).append('file', {
      uri,
      name: filename,
      type: fileType,
    });

    const response = await apiClient.post<{ data: { url: string } | string }>(
      '/businesses/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const resData = response.data;
    if (typeof resData === 'object' && resData !== null && 'data' in resData) {
      const inner = resData.data;
      return typeof inner === 'string' ? inner : inner.url;
    }
    const rawResData: unknown = resData;
    return rawResData as string;
  }

  async getNearbyBusinesses(params?: NearbyBusinessesParams): Promise<readonly Business[]> {
    try {
      const response = await apiClient.get<any>('/businesses', { params });
      const resData = response.data;
      const items: Business[] = Array.isArray(resData?.data)
        ? resData.data
        : Array.isArray(resData?.data?.items)
        ? resData.data.items
        : Array.isArray(resData?.items)
        ? resData.items
        : Array.isArray(resData)
        ? resData
        : [];
      return items;
    } catch {
      return [];
    }
  }
}
