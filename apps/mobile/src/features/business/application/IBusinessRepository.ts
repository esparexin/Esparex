import { Business } from '@esparex/contracts';
import { BusinessFormState } from '../domain/BusinessFormState';

export interface NearbyBusinessesParams {
  locationId?: string;
  listingCategoryId?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  limit?: number;
  serviceOnly?: boolean;
}

export interface IBusinessRepository {
  getMyBusiness(): Promise<Business | null>;
  registerBusiness(state: BusinessFormState): Promise<Business>;
  uploadDocument(uri: string, fileType: string): Promise<string>;
  getNearbyBusinesses(params?: NearbyBusinessesParams): Promise<readonly Business[]>;
}
