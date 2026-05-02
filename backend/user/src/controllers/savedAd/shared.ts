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
    return String(raw);
};

export type { SavedAdRequest };
