import { IListingRepository } from './IListingRepository';
import { Listing } from '../domain/Listing';
import { ListingQueryParams, CreateListingRequest, Category } from '@esparex/contracts';

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

  public async getSavedListings(): Promise<readonly Listing[]> {
    try {
      return await this.repository.getSavedListings();
    } catch (error) {
      console.error('ListingService.getSavedListings failed:', error);
      throw error;
    }
  }

  public async toggleSaveListing(adId: string, isSaved: boolean): Promise<void> {
    try {
      return await this.repository.toggleSaveListing(adId, isSaved);
    } catch (error) {
      console.error(`ListingService.toggleSaveListing failed for ID ${adId}:`, error);
      throw error;
    }
  }

  public async updateListing(id: string, request: Partial<CreateListingRequest>): Promise<Listing> {
    try {
      return await this.repository.update(id, request);
    } catch (error) {
      console.error(`ListingService.updateListing failed for ID ${id}:`, error);
      throw error;
    }
  }

  public async getCategories(): Promise<readonly Category[]> {
    try {
      return await this.repository.getCategories();
    } catch (error) {
      console.error('ListingService.getCategories failed:', error);
      throw error;
    }
  }
}
