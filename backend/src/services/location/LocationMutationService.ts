import mongoose from 'mongoose';
import Location from '../../models/Location';

/**
 * Handles all state-changing operations for the Location domain.
 */

export const generateLocationId = () => new mongoose.Types.ObjectId();

export const createLocationRecord = async (data: Record<string, unknown>) =>
    Location.create(data);

export const saveLocation = async (location: { save: () => Promise<unknown> }) =>
    location.save();

export const softDeleteLocation = async (location: { softDelete: () => Promise<unknown> }) =>
    (location as unknown as { softDelete: () => Promise<unknown> }).softDelete();
