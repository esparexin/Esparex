import { Request, Response, NextFunction } from 'express';
import { LISTING_TYPE, type ListingTypeValue } from '../../../shared/enums/listingType';
import { sendErrorResponse } from '../utils/errorResponse';

/**
 * requireListingType — Route-level middleware that enforces the listingType
 * in the request body matches the expected type for the route.
 *
 * Usage:
 *   router.post('/', requireListingType(LISTING_TYPE.AD), handler)
 *
 * If the caller sends a wrong listingType (e.g. 'service' on the /ads route),
 * the request is rejected with 400 before any controller logic runs.
 * If no listingType is provided in the body, it is silently coerced to the
 * expected type so downstream services always receive a valid discriminator.
 */
export const requireListingType = (expected: ListingTypeValue) =>
    (req: Request, res: Response, next: NextFunction) => {
        const provided = req.body?.listingType;

        if (provided && provided !== expected) {
            const routeMap: Partial<Record<ListingTypeValue, string>> = {
                [LISTING_TYPE.SERVICE]:    '/api/v1/services',
                [LISTING_TYPE.SPARE_PART]: '/api/v1/spare-part-listings',
                [LISTING_TYPE.AD]:         '/api/v1/ads',
            };
            const correctRoute = routeMap[provided as ListingTypeValue];
            return sendErrorResponse(
                req,
                res,
                400,
                `listingType '${provided}' is not valid for this route. Use ${correctRoute ?? 'the correct route'} instead.`,
                {
                    code: 'WRONG_LISTING_TYPE',
                    details: { expected, received: provided, correctRoute },
                }
            );
        }

        // Coerce to expected type when not provided — avoids undefined discriminator downstream
        if (!provided) {
            req.body = req.body ?? {};
            req.body.listingType = expected;
        }

        next();
    };
