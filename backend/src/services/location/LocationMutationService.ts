import mongoose from 'mongoose';
import Location from '../../models/Location';
import { LocationCacheService } from './LocationCacheService';


/**
 * Handles all state-changing operations for the Location domain.
 */

export const generateLocationId = () => new mongoose.Types.ObjectId();

export const createLocationRecord = async (data: Record<string, unknown>) => {
    const location = await Location.create(data);
    if (location?._id) {
        LocationCacheService.set(location._id.toString(), location.toObject()).catch(() => {});
    }
    return location;
};

export const saveLocation = async (location: any) => {
    const saved = await location.save();
    if (saved?._id) {
        LocationCacheService.invalidate(saved._id.toString()).catch(() => {});
    }
    return saved;
};

export const softDeleteLocation = async (location: any) => {
    const res = await (location as any).softDelete();
    if (location?._id) {
        LocationCacheService.invalidate(location._id.toString()).catch(() => {});
    }
    return res;
};

