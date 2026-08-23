import { LocationMeta } from '@esparex/contracts';
import { ILocationRepository } from './ILocationRepository';

export class LocationService {
  constructor(private readonly locationRepo: ILocationRepository) {}

  async searchLocations(query: string): Promise<LocationMeta[]> {
    return this.locationRepo.searchLocations(query);
  }

  async detectLocation(): Promise<LocationMeta> {
    return this.locationRepo.detectLocation();
  }
}
