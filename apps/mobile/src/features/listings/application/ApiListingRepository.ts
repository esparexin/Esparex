import { IListingRepository } from './IListingRepository';
import { Listing } from '../domain/Listing';
import { CreatedListing } from '../domain/CreatedListing';
import { ListingMapper } from '../infrastructure/mappers/ListingMapper';
import { CreatedListingMapper } from '../infrastructure/mappers/CreatedListingMapper';
import { apiClient } from '../../../infrastructure/api/apiClient';
import type { Ad, PaginatedResponse } from '@esparex/contracts';
import { ListingQueryParams, CreateListingRequest } from '@esparex/contracts';

export class ApiListingRepository implements IListingRepository {
  public async getListings(params?: ListingQueryParams): Promise<readonly Listing[]> {
    const queryParams: Record<string, unknown> = { ...params };
    if (queryParams.search && !queryParams.q) {
      queryParams.q = queryParams.search;
    }
    delete queryParams.search;

    if (queryParams.condition && !queryParams.deviceCondition) {
      if (queryParams.condition === 'power_on' || queryParams.condition === 'power_off') {
        queryParams.deviceCondition = queryParams.condition;
      }
    }

    const response = await apiClient.get<PaginatedResponse<Ad> | Ad[]>('/listings', { params: queryParams });
    const resData = response.data;

    const items: Ad[] = Array.isArray(resData)
      ? resData
      : Array.isArray(resData?.data)
      ? resData.data
      : [];

    return items.map(ListingMapper.mapAdToListing);
  }

  public async getListingById(id: string): Promise<Listing> {
    const response = await apiClient.get<{ data: Ad }>(`/listings/${id}`);
    const ad = response.data?.data || response.data;
    return ListingMapper.mapAdToListing(ad);
  }

  public async getMyListings(params?: ListingQueryParams): Promise<readonly Listing[]> {
    const response = await apiClient.get<{
      data?: { items?: Ad[] } | Ad[];
      items?: Ad[];
    } | Ad[]>('/listings/mine', { params });
    const resData = response.data;
    const items = Array.isArray(resData)
      ? resData
      : Array.isArray(resData?.data)
      ? resData.data
      : Array.isArray(resData?.data?.items)
      ? resData.data.items
      : Array.isArray(resData?.items)
      ? resData.items
      : [];
    return items.map(ListingMapper.mapAdToListing);
  }

  public async getSavedListings(): Promise<readonly Listing[]> {
    const response = await apiClient.get<{ data: Ad[] }>('/users/saved-ads');
    const resData = response.data;
    const items = Array.isArray(resData?.data)
      ? resData.data
      : Array.isArray(resData)
      ? resData
      : [];
    return items.map(ListingMapper.mapAdToListing);
  }

  public async toggleSaveListing(adId: string, isSaved: boolean): Promise<void> {
    if (isSaved) {
      await apiClient.delete(`/users/saved-ads/${adId}`);
    } else {
      await apiClient.post('/users/saved-ads', { adId });
    }
  }

  public async create(request: CreateListingRequest): Promise<CreatedListing> {
    const response = await apiClient.post<{ data: Ad }>('/listings', request);
    const ad = response.data?.data || response.data;
    return CreatedListingMapper.fromDto(ad);
  }

  public async update(id: string, request: Partial<CreateListingRequest>): Promise<Listing> {
    const response = await apiClient.patch<{ data: Ad }>(`/listings/${id}/edit`, request);
    const ad = response.data?.data || response.data;
    return ListingMapper.mapAdToListing(ad);
  }

  public async reportListing(adId: string, reason: string, description?: string): Promise<void> {
    await apiClient.post('/reports', {
      targetType: 'ad',
      targetId: adId,
      reason,
      description,
    });
  }
}
