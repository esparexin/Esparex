import mongoose, { type HydratedDocument } from 'mongoose';
import { locationRepository } from '../../composition/location';
import type { ILocation } from '../../models/Location';
import { LocationCacheService } from './LocationCacheService';


/**
 * Handles all state-changing operations for the Location domain via LocationRepositoryPort.
 */

export const generateLocationId = () => new mongoose.Types.ObjectId();

export const createLocationRecord = async (data: Record<string, unknown>) => {
    const location = await locationRepository.createLocation(data);
    if (location?._id) {
        LocationCacheService.set(location._id.toString(), (location.toObject ? location.toObject() : location) as unknown as Record<string, unknown>).catch(() => {});
    }
    return location;
};


export const saveLocation = async (location: HydratedDocument<ILocation>): Promise<HydratedDocument<ILocation>> => {
    const saved = await location.save();
    if (saved?._id) {
        LocationCacheService.invalidate(saved._id.toString()).catch(() => {});
    }
    return saved;
};

export const softDeleteLocation = async (location: HydratedDocument<ILocation>): Promise<void> => {
    await (location).softDelete();
    if (location?._id) {
        LocationCacheService.invalidate(location._id.toString()).catch(() => {});
    }
};



