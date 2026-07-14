import { AppError } from '../../utils/AppError';
import { getAllGeofences, createGeofenceRecord, updateGeofenceById, deleteGeofenceById } from '../location/GeofenceService';
import type { AdminLogFn } from '../AdminListingsService';

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    Object.prototype.toString.call(value) === '[object Object]';

const sanitizeGeofenceUpdatePayload = (body: Record<string, unknown>): Record<string, unknown> => {
    if (!isPlainObject(body)) {
        throw new AppError('Invalid geofence payload', 400);
    }
    const allowedKeys = new Set(['name', 'boundary', 'isActive', 'metadata']);
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
        if (!allowedKeys.has(key)) continue;
        sanitized[key] = value;
    }
    return sanitized;
};

export const adminGetGeofences = async () => getAllGeofences();

export const adminCreateGeofence = async (body: Record<string, unknown>, logFn: AdminLogFn) => {
    const sanitizedBody = sanitizeGeofenceUpdatePayload(body);
    const geofence = await createGeofenceRecord(sanitizedBody);
    await logFn('CREATE_GEOFENCE', 'Geofence', (geofence as { _id: { toString(): string } })._id.toString(), { name: (geofence as { name?: string }).name });
    return geofence;
};

export const adminUpdateGeofence = async (id: string, body: Record<string, unknown>, logFn: AdminLogFn) => {
    const sanitizedBody = sanitizeGeofenceUpdatePayload(body);
    const geofence = await updateGeofenceById(id, sanitizedBody);
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
