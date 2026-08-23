import { Listing } from '../domain/Listing';
import { CreatedListing } from '../domain/CreatedListing';
import { ListingQueryParams, CreateListingRequest, Category } from '@esparex/contracts';

export interface IListingRepository {
  getListings(params?: ListingQueryParams): Promise<readonly Listing[]>;
  getListingById(id: string): Promise<Listing>;
  getMyListings(params?: ListingQueryParams): Promise<readonly Listing[]>;
  getSavedListings(): Promise<readonly Listing[]>;
  toggleSaveListing(adId: string, isSaved: boolean): Promise<void>;
  create(request: CreateListingRequest): Promise<CreatedListing>;
  update(id: string, request: Partial<CreateListingRequest>): Promise<Listing>;
  getCategories(): Promise<readonly Category[]>;
  reportListing(adId: string, reason: string, description?: string): Promise<void>;
}
