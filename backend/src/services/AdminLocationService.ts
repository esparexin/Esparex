import mongoose from 'mongoose';
import Location from '../models/Location';
import Ad from '../models/Ad';
import User from '../models/User';
import Geofence from '../models/Geofence';
import { LOCATION_STATUS } from '@shared/enums/locationStatus';
import logger from '../utils/logger';

const LOCATION_LIST_HINT = { isActive: 1, createdAt: -1 } as const;
let hasWarnedLocationListHintFailure = false;

// ─── Location reads ───────────────────────────────────────────────────────────

export const findLocationById = async (id: string | undefined) => {
    if (!id) return null;
    return Location.findById(id);
};

export const findLocationByIdLean = async <T>(id: string | undefined, select: string) => {
    if (!id) return null;
    return Location.findById(id).select(select).lean<T | null>();
};

export const findActiveParentById = async (id: string) =>
    Location.findOne({ _id: id, isActive: true })
        .select('_id level path')
        .lean();

export const locationExists = async (id: string) =>
    Location.exists({ _id: id, isActive: true });

export const findLocationParent = async (parentId: unknown) =>
    Location.findById(parentId)
        .select('_id level path country')
        .lean();

export const findDuplicateLocation = async (
    name: string,
    country: string,
    level: string,
    parentId: unknown
) =>
    Location.findOne({
        name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        country,
        level,
        parentId: parentId || null,
    });

export const getDistinctStateLocations = async () =>
    Location.find({ isActive: true, level: 'state' })
        .select('name')
        .lean<Array<{ name?: string }>>();

// ─── Location writes ──────────────────────────────────────────────────────────

export const generateLocationId = () => new mongoose.Types.ObjectId();

export const createLocationRecord = async (data: Record<string, unknown>) =>
    Location.create(data);

export const saveLocation = async (location: { save: () => Promise<unknown> }) =>
    location.save();

export const softDeleteLocation = async (location: { softDelete: () => Promise<unknown> }) =>
    (location as unknown as { softDelete: () => Promise<unknown> }).softDelete();

// ─── Location list (admin paginated) ─────────────────────────────────────────

export const getLocationsPaginated = async (
    query: Record<string, unknown>,
    skip: number,
    limit: number
): Promise<{ locations: unknown[]; total: number }> => {
    const hasAnyFilter = Object.keys(query).length > 0;

    const buildQuery = () =>
        Location.find(query)
            .select('_id name slug country level parentId path coordinates isActive verificationStatus createdAt updatedAt')
            .lean()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

    const getTotal = async () => {
        if (!hasAnyFilter) return Location.estimatedDocumentCount();
        try {
            return await Location.countDocuments(query).hint(LOCATION_LIST_HINT);
        } catch (error) {
            if (!hasWarnedLocationListHintFailure) {
                hasWarnedLocationListHintFailure = true;
                logger.warn('Location count hint unavailable; retrying without hint', {
                    error: error instanceof Error ? error.message : String(error),
                });
            }
            return Location.countDocuments(query);
        }
    };

    const getLocations = async () => {
        if (!hasAnyFilter) return buildQuery();
        try {
            return await buildQuery().hint(LOCATION_LIST_HINT);
        } catch (error) {
            if (!hasWarnedLocationListHintFailure) {
                hasWarnedLocationListHintFailure = true;
                logger.warn('Location list hint unavailable; retrying without hint', {
                    error: error instanceof Error ? error.message : String(error),
                });
            }
            return buildQuery();
        }
    };

    const [total, locations] = await Promise.all([getTotal(), getLocations()]);
    return { locations: locations as unknown[], total };
};

// ─── Moderation queue ─────────────────────────────────────────────────────────

export const getModerationQueuePaginated = async (page: number, limit: number) => {
    const query = { verificationStatus: LOCATION_STATUS.PENDING };
    const [total, locations] = await Promise.all([
        Location.countDocuments(query).hint({ verificationStatus: 1, createdAt: 1 }),
        Location.find(query)
            .select('_id name city district state country level coordinates isActive verificationStatus requestedBy createdAt')
            .lean()
            .populate('requestedBy', 'firstName lastName email')
            .sort({ createdAt: 1 })
            .skip((page - 1) * limit)
            .limit(limit),
    ]);
    return { total, locations };
};

// ─── Dependency checks ────────────────────────────────────────────────────────

export const countAdsForLocation = async (query: Record<string, unknown>) =>
    Ad.countDocuments(query);

export const countUsersForLocation = async (query: Record<string, unknown>) =>
    User.countDocuments(query);

// ─── Geofence ─────────────────────────────────────────────────────────────────

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
