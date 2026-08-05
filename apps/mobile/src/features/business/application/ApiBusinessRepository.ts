import { Business } from '@esparex/contracts';
import { apiClient } from '../../../infrastructure/api/apiClient';
import { BusinessFormState } from '../domain/BusinessFormState';
import { IBusinessRepository } from './IBusinessRepository';
import { CreateBusinessRequestMapper } from './mappers/CreateBusinessRequestMapper';

export class ApiBusinessRepository implements IBusinessRepository {
  async getMyBusiness(): Promise<Business | null> {
    try {
      const response = await apiClient.get<{ data: Business }>('/v1/businesses/me');
      return response.data.data || (response.data as unknown as Business) || null;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async registerBusiness(state: BusinessFormState): Promise<Business> {
    const payload = CreateBusinessRequestMapper.toPayload(state);
    const response = await apiClient.post<{ data: Business }>('/v1/businesses', payload);
    return response.data.data || (response.data as unknown as Business);
  }

  async uploadDocument(uri: string, fileType: string): Promise<string> {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'upload.jpg';
    
    // Attach file matching backend multer 'file' field
    formData.append('file', {
      uri,
      name: filename,
      type: fileType,
    } as any);

    const response = await apiClient.post<{ data: { url: string } | string }>(
      '/v1/businesses/upload',
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
    return resData as unknown as string;
  }
}
