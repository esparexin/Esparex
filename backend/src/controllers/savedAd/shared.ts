import { Request } from 'express';

type RequestUser = {
    _id?: string | { toString: () => string };
};

type SavedAdRequest = Request & {
    user?: RequestUser;
};

export const getUserId = (req: SavedAdRequest): string | null => {
    const raw = req.user?._id;
    if (!raw) return null;
    if (typeof raw === 'string') return raw;
    if (typeof raw.toString === 'function') return raw.toString();
    return null;
};

export type { SavedAdRequest };
