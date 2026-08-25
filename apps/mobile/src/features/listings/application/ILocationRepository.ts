import { LocationMeta } from '@esparex/contracts';

export interface ILocationRepository {
  searchLocations(query: string): Promise<LocationMeta[]>;
  detectLocation(): Promise<LocationMeta>;
}
