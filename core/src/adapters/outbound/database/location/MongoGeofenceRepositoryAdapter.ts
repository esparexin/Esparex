import Geofence, { type IGeofence } from '../../../../models/Geofence';
import { GeofenceRepositoryPort } from '../../../../domains/location';
import type { UpdateQuery } from 'mongoose';

export class MongoGeofenceRepositoryAdapter implements GeofenceRepositoryPort {
    private isPlainObject(value: unknown): value is Record<string, unknown> {
        return Object.prototype.toString.call(value) === '[object Object]';
    }

    private sanitizeForMongo(value: unknown): unknown {
        if (Array.isArray(value)) {
            return value.map((item) => this.sanitizeForMongo(item));
        }

        if (!this.isPlainObject(value)) {
            return value;
        }

        const sanitized: Record<string, unknown> = {};
        for (const [key, nestedValue] of Object.entries(value)) {
            // Prevent Mongo operator/path injection via user-controlled keys.
            if (key.startsWith('$') || key.includes('.')) continue;
            sanitized[key] = this.sanitizeForMongo(nestedValue);
        }

        return sanitized;
    }

    public async getAllGeofences(): Promise<IGeofence[]> {
        return Geofence.find().sort({ createdAt: -1 });
    }

    public async createGeofence(data: Partial<IGeofence>): Promise<IGeofence> {
        const sanitizedData = this.sanitizeForMongo(data) as Partial<IGeofence>;
        return Geofence.create(sanitizedData) as unknown as Promise<IGeofence>;
    }

    public async updateGeofence(id: string, data: UpdateQuery<IGeofence>): Promise<IGeofence | null> {
        const sanitizedData = this.sanitizeForMongo(data);
        return Geofence.findByIdAndUpdate(id, sanitizedData as UpdateQuery<IGeofence>, { new: true });
    }

    public async deleteGeofence(id: string): Promise<IGeofence | null> {
        return Geofence.findByIdAndDelete(id);
    }

    public async findIntersectingGeofences(coordinates: [number, number]): Promise<IGeofence[]> {
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
