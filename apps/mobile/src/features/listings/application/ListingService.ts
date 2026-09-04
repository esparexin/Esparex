import { IListingRepository } from './IListingRepository';
import { Listing } from '../domain/Listing';
import { ListingQueryParams, CreateListingRequest } from '@esparex/contracts';

export class ListingService {
  constructor(private readonly repository: IListingRepository) {}

  public async getMarketplaceFeed(params?: ListingQueryParams): Promise<readonly Listing[]> {
    return this.repository.getListings(params);
  }

  public async getListingDetails(id: string): Promise<Listing> {
    return this.repository.getListingById(id);
  }

  public async getMyListings(params?: ListingQueryParams): Promise<readonly Listing[]> {
    return this.repository.getMyListings(params);
  }

  public async getSavedListings(): Promise<readonly Listing[]> {
    return this.repository.getSavedListings();
  }

  public async toggleSaveListing(adId: string, isSaved: boolean): Promise<void> {
    return this.repository.toggleSaveListing(adId, isSaved);
  }

  public async updateListing(id: string, request: Partial<CreateListingRequest>): Promise<Listing> {
    return this.repository.update(id, request);
  }

  public async reportListing(adId: string, reason: string, description?: string): Promise<void> {
    return this.repository.reportListing(adId, reason, description);
  }
}
