import { Listing } from '../domain/Listing';
import { CreatedListing } from '../domain/CreatedListing';
import { ListingQueryParams, CreateListingRequest } from '@esparex/contracts';

export interface IListingRepository {
  getListings(params?: ListingQueryParams): Promise<readonly Listing[]>;
  getListingById(id: string): Promise<Listing>;
  create(request: CreateListingRequest): Promise<CreatedListing>;
}
