import { Request } from 'express';

export const getUserId = (req: Request): string | null => {
    const raw = req.user?._id;
    if (!raw) return null;
    if (typeof raw === 'string') return raw;
    if (typeof raw.toString === 'function') return raw.toString();
    return null;
};
