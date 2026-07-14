import { MongoLocationRepositoryAdapter } from '../adapters/outbound/database/location/MongoLocationRepositoryAdapter';
import { MongoLocationAnalyticsRepositoryAdapter } from '../adapters/outbound/database/location/MongoLocationAnalyticsRepositoryAdapter';
import { MongoAdminBoundaryRepositoryAdapter } from '../adapters/outbound/database/location/MongoAdminBoundaryRepositoryAdapter';
import { MongoGeofenceRepositoryAdapter } from '../adapters/outbound/database/location/MongoGeofenceRepositoryAdapter';
import { MongoLocationEventRepositoryAdapter } from '../adapters/outbound/database/location/MongoLocationEventRepositoryAdapter';
import {
    LocationRepositoryPort,
    LocationAnalyticsRepositoryPort,
    AdminBoundaryRepositoryPort,
    GeofenceRepositoryPort,
    LocationEventRepositoryPort
} from '../domains/location';

export const locationRepository: LocationRepositoryPort = new MongoLocationRepositoryAdapter();
export const locationAnalyticsRepository: LocationAnalyticsRepositoryPort = new MongoLocationAnalyticsRepositoryAdapter();
export const adminBoundaryRepository: AdminBoundaryRepositoryPort = new MongoAdminBoundaryRepositoryAdapter();
export const geofenceRepository: GeofenceRepositoryPort = new MongoGeofenceRepositoryAdapter();
export const locationEventRepository: LocationEventRepositoryPort = new MongoLocationEventRepositoryAdapter();

