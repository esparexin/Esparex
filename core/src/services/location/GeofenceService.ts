import { geofenceRepository } from '../../composition/location';

/**
 * Handles all Geofence-specific CRUD operations via GeofenceRepositoryPort.
 */

export const getAllGeofences = async () => geofenceRepository.getAllGeofences();

export const createGeofenceRecord = async (data: Record<string, unknown>) =>
    geofenceRepository.createGeofence(data);

export const updateGeofenceById = async (id: string | undefined, data: Record<string, unknown>) => {
    if (!id) return null;
    return geofenceRepository.updateGeofence(id, data);
};

export const deleteGeofenceById = async (id: string | undefined) => {
    if (!id) return null;
    return geofenceRepository.deleteGeofence(id);
};

