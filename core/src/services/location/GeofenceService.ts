import Geofence from '../../models/Geofence';

/**
 * Handles all Geofence-specific CRUD operations.
 */

export const getAllGeofences = async () => Geofence.find().sort({ createdAt: -1 });

export const createGeofenceRecord = async (data: Record<string, unknown>) =>
    Geofence.create(data);

export const updateGeofenceById = async (id: string | undefined, data: Record<string, unknown>) => {
    if (!id) return null;
    return Geofence.findByIdAndUpdate(id, data, { new: true });
};

export const deleteGeofenceById = async (id: string | undefined) => {
    if (!id) return null;
    return Geofence.findByIdAndDelete(id);
};
