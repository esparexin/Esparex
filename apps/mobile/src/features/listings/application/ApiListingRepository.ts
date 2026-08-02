import { IListingRepository } from './IListingRepository';
import { Listing } from '../domain/Listing';
import { CreatedListing } from '../domain/CreatedListing';
import { ListingMapper } from '../infrastructure/mappers/ListingMapper';
import { CreatedListingMapper } from '../infrastructure/mappers/CreatedListingMapper';
import { apiClient } from '../../../infrastructure/api/apiClient';
import type { Ad } from '@esparex/contracts/src/v1/listings/schema/ad.schema';
import { ListingQueryParams, CreateListingRequest } from '@esparex/contracts';

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
  };
}

export class ApiListingRepository implements IListingRepository {
  public async getListings(params?: ListingQueryParams): Promise<readonly Listing[]> {
    const response = await apiClient.get<PaginatedResponse<Ad>>('/v1/listings', { params });
    return response.data.data.map(ListingMapper.mapAdToListing);
  }

  public async getListingById(id: string): Promise<Listing> {
    const response = await apiClient.get<{ data: Ad }>(`/v1/listings/${id}`);
    return ListingMapper.mapAdToListing(response.data.data);
  }

  public async getMyListings(params?: ListingQueryParams): Promise<readonly Listing[]> {
    const response = await apiClient.get<PaginatedResponse<Ad>>('/v1/listings/mine', { params });
    return response.data.data.map(ListingMapper.mapAdToListing);
  }

  public async create(request: CreateListingRequest): Promise<CreatedListing> {
    const response = await apiClient.post<{ data: Ad }>('/v1/listings', request);
    return CreatedListingMapper.fromDto(response.data.data);
  }
}
