import mongoose from 'mongoose';
import { AppError } from '../../utils/AppError';
import { getAdForModerationById } from '../ad/AdDetailService';
import { isValidListingType } from '../ListingModerationQueryService';
import { ACTOR_TYPE } from '@esparex/shared';

export const parsePositiveInt = (value: unknown, fallback: number, bounds: { min: number; max: number }) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    const normalized = Math.floor(parsed);
    if (normalized < bounds.min) return bounds.min;
    if (normalized > bounds.max) return bounds.max;
    return normalized;
};

export const asString = (value: unknown): string | undefined =>
    typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;

export const asNumber = (value: unknown): number | undefined => {
    if (value === undefined || value === '' ) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};

export const parseDuplicateBypassPayload = (body?: { allowDuplicateBypass?: unknown; duplicateBypassReason?: unknown }) => {
    const allowDuplicateBypass = body?.allowDuplicateBypass === true;
    const duplicateBypassReason = typeof body?.duplicateBypassReason === 'string' ? body.duplicateBypassReason.trim() : '';
    return { allowDuplicateBypass, duplicateBypassReason };
};

export const sanitizeDuplicateBypassPayload = (body: Record<string, unknown>) => {
    const payload = { ...body };
    delete payload.allowDuplicateBypass;
    delete payload.duplicateBypassReason;
    return payload;
};

export const validateDuplicateBypass = (allowDuplicateBypass: boolean, duplicateBypassReason: string) => {
    if (allowDuplicateBypass && duplicateBypassReason.length < 12) {
        throw new AppError('A detailed duplicate bypass reason (minimum 12 characters) is required.', 400);
    }
};

export const resolveListingTypeFilter = (raw: unknown): string | undefined => {
    const val = typeof raw === 'string' ? raw.trim().toLowerCase() : undefined;
    return val && isValidListingType(val) ? val : undefined;
};

export const buildAdminActor = (actorId: string) => ({
    type: ACTOR_TYPE.ADMIN,
    id: actorId,
});

export const validateListingId = (id: string): string => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid listing id', 400);
    return id;
};

export const getListingForMutation = async (id: string) => {
    const listing = await getAdForModerationById(id);
    if (!listing) throw new AppError('Listing not found', 404);
    return listing;
};
