import { Request } from 'express';

export const getUserId = (req: Request): string | null => {
    const raw = (req.user)?._id;
    if (!raw) return null;
    return String(raw);
};
