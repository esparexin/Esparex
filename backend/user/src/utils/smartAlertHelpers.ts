import { Request } from 'express';
import { normalizeLocationResponse } from '@esparex/core/services/location/LocationNormalizer';
import { serializeDoc } from '@esparex/core/utils/serialize';
import { AppError } from '@esparex/core/utils/AppError';

export const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : 'Unexpected error';

type SerializedSmartAlert = {
    criteria?: Record<string, unknown>;
    coordinates?: unknown;
} & Record<string, unknown>;

export const getRequiredAlertId = (req: Request): string => {
    const id = req.params.id;
    if (typeof id !== 'string' || !id.trim()) {
        throw new AppError('Invalid alert ID', 400, 'INVALID_ALERT_ID');
    }
    return id;
};

export const toAlertContract = (alert: unknown) => {
    const serialized = serializeDoc(alert) as SerializedSmartAlert;
    const serializedCriteria = (serialized.criteria ?? {});
    const location = normalizeLocationResponse({
        locationId: serializedCriteria.locationId,
        display: serializedCriteria.location,
        city: serializedCriteria.location,
        coordinates: serialized.coordinates
    });

    return {
        ...serialized,
        coordinates: location?.coordinates || serialized.coordinates,
        location: location || undefined,
        criteria: {
            ...serializedCriteria,
            location: location?.display || serializedCriteria.location,
            locationId: location?.id || serializedCriteria.locationId
        }
    };
};
