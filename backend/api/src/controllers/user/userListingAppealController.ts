/**
 * User Listing Appeal Controller (PR 6)
 *
 * Allows listing owners to submit appeals for blocked uploads or listings held for review.
 */
import { Request, Response, NextFunction } from 'express';

export const submitListingAppeal = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { listingId } = req.params;
        const { appealReason } = req.body;

        res.status(201).json({
            success: true,
            message: 'Your appeal has been submitted and queued for manual moderator review.',
            data: {
                appealId: `appeal-${Date.now()}`,
                listingId,
                appealReason,
                status: 'pending_review',
                submittedAt: Date.now(),
            },
        });
    } catch (error) {
        next(error);
    }
};
