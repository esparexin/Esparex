import { IListingRepository } from './IListingRepository';
import { Listing } from '../domain/Listing';
import { ListingQueryParams } from '@esparex/contracts';

export class ListingService {
  constructor(private readonly repository: IListingRepository) {}

  public async getMarketplaceFeed(params?: ListingQueryParams): Promise<readonly Listing[]> {
    try {
      return await this.repository.getListings(params);
    } catch (error) {
      console.error('ListingService.getMarketplaceFeed failed:', error);
      throw error;
    }
  }

  public async getListingDetails(id: string): Promise<Listing> {
    try {
      return await this.repository.getListingById(id);
    } catch (error) {
      console.error(`ListingService.getListingDetails failed for ID ${id}:`, error);
      throw error;
    }
  }

  public async getMyListings(params?: ListingQueryParams): Promise<readonly Listing[]> {
    try {
      return await this.repository.getMyListings(params);
    } catch (error) {
      console.error('ListingService.getMyListings failed:', error);
      throw error;
    }
  }
}
