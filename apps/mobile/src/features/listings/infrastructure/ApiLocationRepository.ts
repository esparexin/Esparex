import { AxiosInstance } from 'axios';
import { LocationMeta } from '@esparex/contracts';
import { ILocationRepository } from '../application/ILocationRepository';

export class ApiLocationRepository implements ILocationRepository {
  constructor(private readonly client: AxiosInstance) {}

  async searchLocations(query: string): Promise<LocationMeta[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const response = await this.client.get<{ success: boolean; data: LocationMeta[] }>(
      '/locations',
      { params: { q: trimmed } }
    );
    return response.data?.success && Array.isArray(response.data.data) ? response.data.data : [];
  }

  async detectLocation(): Promise<LocationMeta> {
    try {
      const response = await this.client.get<{ success: boolean; data: LocationMeta }>(
        '/locations/ip-locate'
      );
      if (response.data?.success && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback to default-center
    }

    const defaultResp = await this.client.get<{ success: boolean; data: LocationMeta }>(
      '/locations/default-center'
    );
    if (defaultResp.data?.success && defaultResp.data.data) {
      return defaultResp.data.data;
    }
    throw new Error('Location detection unavailable');
  }
}
