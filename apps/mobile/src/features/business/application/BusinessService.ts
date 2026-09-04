import { Business } from '@esparex/contracts';
import { BusinessFormState } from '../domain/BusinessFormState';
import { IBusinessRepository, NearbyBusinessesParams } from './IBusinessRepository';

export class BusinessService {
  constructor(private readonly businessRepository: IBusinessRepository) {}

  async getMyBusiness(): Promise<Business | null> {
    return this.businessRepository.getMyBusiness();
  }

  async registerBusiness(state: BusinessFormState): Promise<Business> {
    return this.businessRepository.registerBusiness(state);
  }

  async updateBusiness(businessId: string, state: Partial<BusinessFormState>): Promise<Business> {
    return this.businessRepository.updateBusiness(businessId, state);
  }

  async uploadDocument(uri: string, fileType: string): Promise<string> {
    return this.businessRepository.uploadDocument(uri, fileType);
  }

  async getNearbyBusinesses(params?: NearbyBusinessesParams): Promise<readonly Business[]> {
    return this.businessRepository.getNearbyBusinesses(params);
  }
}
