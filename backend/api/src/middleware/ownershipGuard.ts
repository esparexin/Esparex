import { Request, Response, NextFunction } from 'express';
import { getAndVerifyOwnedListing } from "../utils/controllerUtils";

export const requireListingOwner = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const listing = await getAndVerifyOwnedListing(req, res);
    if (!listing) return; // Error response already sent by helper

    req.listing = listing;
    next();
};
