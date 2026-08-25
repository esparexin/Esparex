import { Business } from '@esparex/contracts';
import { BusinessFormState } from '../domain/BusinessFormState';

export interface IBusinessRepository {
  getMyBusiness(): Promise<Business | null>;
  registerBusiness(state: BusinessFormState): Promise<Business>;
  uploadDocument(uri: string, fileType: string): Promise<string>;
  getNearbyBusinesses(params?: { category?: string; city?: string; limit?: number }): Promise<readonly Business[]>;
}
