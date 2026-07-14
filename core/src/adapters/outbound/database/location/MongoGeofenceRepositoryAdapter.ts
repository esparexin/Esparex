import Geofence from '../../../../models/Geofence';
import { GeofenceRepositoryPort } from '../../../../domains/location';

export class MongoGeofenceRepositoryAdapter implements GeofenceRepositoryPort {
    public async getAllGeofences(): Promise<any[]> {
        return Geofence.find().sort({ createdAt: -1 });
    }

    public async createGeofence(data: any): Promise<any> {
        return Geofence.create(data);
    }

    public async updateGeofence(id: string, data: any): Promise<any | null> {
        return Geofence.findByIdAndUpdate(id, data, { new: true });
    }

    public async deleteGeofence(id: string): Promise<any | null> {
        return Geofence.findByIdAndDelete(id);
    }

    public async findIntersectingGeofences(coordinates: [number, number]): Promise<any[]> {
        return Geofence.find({
            boundary: {
                $geoIntersects: {
                    $geometry: {
                        type: 'Point',
                        coordinates
                    }
                }
            }
        });
    }
}
