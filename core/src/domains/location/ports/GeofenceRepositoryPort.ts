import type { IGeofence } from '../../../models/Geofence';
import type { UpdateQuery } from 'mongoose';

/**
 * @todo ARCH-118: Transitional dependency on Mongoose.
 */
export interface GeofenceRepositoryPort {
    getAllGeofences(): Promise<IGeofence[]>;
    createGeofence(data: Partial<IGeofence>): Promise<IGeofence>;
    updateGeofence(id: string, data: UpdateQuery<IGeofence>): Promise<IGeofence | null>;
    deleteGeofence(id: string): Promise<IGeofence | null>;
    findIntersectingGeofences(coordinates: [number, number]): Promise<IGeofence[]>;
}
