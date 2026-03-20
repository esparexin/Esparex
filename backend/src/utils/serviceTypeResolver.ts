import mongoose from 'mongoose';
import ServiceType from '../models/ServiceType';
import { escapeRegExp } from './stringUtils';

export const toServiceTypeObjectId = (value: unknown): mongoose.Types.ObjectId | undefined => {
    if (value instanceof mongoose.Types.ObjectId) return value;
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    if (!mongoose.Types.ObjectId.isValid(trimmed)) return undefined;
    return new mongoose.Types.ObjectId(trimmed);
};

const normalizeServiceTypeTokens = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value
        .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
        .filter((entry) => entry.length > 0);
};

export const resolveServiceTypes = async (
    rawServiceTypes: unknown,
    categoryId?: unknown
): Promise<{ serviceTypeIds: mongoose.Types.ObjectId[] }> => {
    const categoryObjectId = toServiceTypeObjectId(categoryId);
    const tokens = normalizeServiceTypeTokens(rawServiceTypes);
    if (tokens.length === 0) return { serviceTypeIds: [] };

    const explicitIds = Array.from(
        new Set(
            tokens
                .map((token) => toServiceTypeObjectId(token))
                .filter((value): value is mongoose.Types.ObjectId => Boolean(value))
                .map((id) => id.toString())
        )
    );

    const nameTokens = Array.from(
        new Set(tokens.filter((token) => !mongoose.Types.ObjectId.isValid(token)))
    );

    const [byId, byName] = await Promise.all([
        explicitIds.length > 0
            ? ServiceType.find({
                _id: { $in: explicitIds.map((id) => new mongoose.Types.ObjectId(id)) },
                ...(categoryObjectId ? { categoryId: categoryObjectId } : {}),
                isDeleted: { $ne: true }
            }).select('_id').lean()
            : Promise.resolve([]),
        nameTokens.length > 0
            ? ServiceType.find({
                ...(categoryObjectId ? { categoryId: categoryObjectId } : {}),
                isDeleted: { $ne: true },
                $or: nameTokens.map((name) => ({ name: new RegExp(`^${escapeRegExp(name)}$`, 'i') }))
            }).select('_id').lean()
            : Promise.resolve([])
    ]);

    const combined = [...byId, ...byName];
    const seen = new Set<string>();
    const serviceTypeIds: mongoose.Types.ObjectId[] = [];

    combined.forEach((serviceType) => {
        const serviceTypeId = (serviceType as { _id?: unknown })._id;
        const id = typeof serviceTypeId === 'string'
            ? serviceTypeId
            : serviceTypeId && typeof (serviceTypeId as { toString?: () => string }).toString === 'function'
                ? (serviceTypeId as { toString: () => string }).toString()
                : '';
        if (!id || seen.has(id)) return;
        seen.add(id);
        serviceTypeIds.push(new mongoose.Types.ObjectId(id));
    });

    return { serviceTypeIds };
};
