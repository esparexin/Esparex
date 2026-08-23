import { IListingRepository } from './IListingRepository';
import { Listing } from '../domain/Listing';
import { CreatedListing } from '../domain/CreatedListing';
import { ListingMapper } from '../infrastructure/mappers/ListingMapper';
import { CreatedListingMapper } from '../infrastructure/mappers/CreatedListingMapper';
import { apiClient } from '../../../infrastructure/api/apiClient';
import type { Ad } from '@esparex/contracts/src/v1/listings/schema/ad.schema';
import { ListingQueryParams, CreateListingRequest, Category } from '@esparex/contracts';
import { API_ROUTES } from '@esparex/shared';

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
  };
}

export class ApiListingRepository implements IListingRepository {
  public async getListings(params?: ListingQueryParams): Promise<readonly Listing[]> {
    const queryParams: Record<string, any> = { ...params };
    if (queryParams.search && !queryParams.q) {
      queryParams.q = queryParams.search;
    }
    delete queryParams.search;

    const response = await apiClient.get<PaginatedResponse<Ad> | Ad[]>('/listings', { params: queryParams });
    const resData = response.data as {
      data?: Ad[] | { items?: Ad[]; ads?: Ad[] };
      items?: Ad[];
      ads?: Ad[];
    } | Ad[];

    let items: Ad[] = [];
    if (Array.isArray(resData)) {
      items = resData;
    } else if (resData && typeof resData === 'object') {
      if ('data' in resData && resData.data) {
        if (Array.isArray(resData.data)) {
          items = resData.data;
        } else if ('items' in resData.data && Array.isArray(resData.data.items)) {
          items = resData.data.items;
        } else if ('ads' in resData.data && Array.isArray(resData.data.ads)) {
          items = resData.data.ads;
        }
      } else if ('items' in resData && Array.isArray(resData.items)) {
        items = resData.items;
      } else if ('ads' in resData && Array.isArray(resData.ads)) {
        items = resData.ads;
      }
    }
    return items.map(ListingMapper.mapAdToListing);
  }

  public async getListingById(id: string): Promise<Listing> {
    const response = await apiClient.get<{ data: Ad }>(`/listings/${id}`);
    const ad = response.data?.data || response.data;
    return ListingMapper.mapAdToListing(ad);
  }

  public async getMyListings(params?: ListingQueryParams): Promise<readonly Listing[]> {
    const response = await apiClient.get<any>('/listings/mine', { params });
    const resData = response.data;
    const items = Array.isArray(resData?.data?.items)
      ? resData.data.items
      : Array.isArray(resData?.data)
      ? resData.data
      : Array.isArray(resData?.items)
      ? resData.items
      : Array.isArray(resData)
      ? resData
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

  public async getCategories(): Promise<readonly Category[]> {
    const response = await apiClient.get<Category[]>(API_ROUTES.USER.CATEGORIES);
    const data = response.data;
    return Array.isArray((data as any)?.data) ? (data as any).data : Array.isArray(data) ? data : [];
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
