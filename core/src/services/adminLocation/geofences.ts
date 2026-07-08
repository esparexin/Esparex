import { AppError } from '../../utils/AppError';
import { getAllGeofences, createGeofenceRecord, updateGeofenceById, deleteGeofenceById } from '../location/GeofenceService';
import type { AdminLogFn } from '../AdminListingsService';

export const adminGetGeofences = async () => getAllGeofences();

export const adminCreateGeofence = async (body: Record<string, unknown>, logFn: AdminLogFn) => {
    const geofence = await createGeofenceRecord(body);
    await logFn('CREATE_GEOFENCE', 'Geofence', (geofence as { _id: { toString(): string } })._id.toString(), { name: (geofence as { name?: string }).name });
    return geofence;
};

export const adminUpdateGeofence = async (id: string, body: Record<string, unknown>, logFn: AdminLogFn) => {
    const geofence = await updateGeofenceById(id, body);
    if (!geofence) throw new AppError('Geofence not found', 404);
    await logFn('UPDATE_GEOFENCE', 'Geofence', id, { name: (geofence as { name?: string }).name });
    return geofence;
};

export const adminDeleteGeofence = async (id: string, logFn: AdminLogFn) => {
    const geofence = await deleteGeofenceById(id);
    if (!geofence) throw new AppError('Geofence not found', 404);
    await logFn('DELETE_GEOFENCE', 'Geofence', id, { name: (geofence as { name?: string }).name });
    return true;
};
