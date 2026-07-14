export interface GeofenceRepositoryPort {
    getAllGeofences(): Promise<any[]>;
    createGeofence(data: any): Promise<any>;
    updateGeofence(id: string, data: any): Promise<any | null>;
    deleteGeofence(id: string): Promise<any | null>;
    findIntersectingGeofences(coordinates: [number, number]): Promise<any[]>;
}
