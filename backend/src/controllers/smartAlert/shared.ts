import { Request } from 'express';
import SmartAlert from '../../models/SmartAlert';
import UserPlan from '../../models/UserPlan';
import Plan from '../../models/Plan';
import UserWallet from '../../models/UserWallet';
import {
    normalizeCoordinates,
    normalizeLocation,
    normalizeLocationResponse
} from '../../services/location/LocationNormalizer';
import { serializeDoc } from '../../utils/serialize';
import { GOVERNANCE, MS_IN_DAY } from '../../config/constants';
import { AppError } from '../../utils/AppError';

export const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : 'Unexpected error';

export type SmartAlertDocument = {
    userId: { toString: () => string } | string;
    isActive: boolean;
    save: () => Promise<unknown>;
} & Record<string, unknown>;

export type SmartAlertCriteriaPayload = {
    keywords?: string;
    category?: string;
    brand?: string;
    model?: string;
    categoryId?: unknown;
    brandId?: unknown;
    modelId?: unknown;
    coordinates?: unknown;
} & Record<string, unknown>;

export type SmartAlertPayload = {
    criteria?: SmartAlertCriteriaPayload;
    frequency?: unknown;
    name?: unknown;
    coordinates?: unknown;
    radiusKm?: unknown;
    notificationChannels?: unknown;
} & Record<string, unknown>;

type SerializedSmartAlert = {
    criteria?: Record<string, unknown>;
    coordinates?: unknown;
} & Record<string, unknown>;

export const SmartAlertModel = SmartAlert as unknown as {
    countDocuments: (query: Record<string, unknown>) => Promise<number>;
    create: (payload: Record<string, unknown>) => Promise<SmartAlertDocument>;
    find: (query: Record<string, unknown>) => {
        sort: (sortBy: Record<string, 1 | -1>) => Promise<SmartAlertDocument[]>;
    };
    findById: (id: string) => Promise<SmartAlertDocument | null>;
};

export const UserPlanModel = UserPlan as unknown as {
    find: (query: Record<string, unknown>) => {
        lean: () => Promise<Array<{ planId: unknown }>>;
    };
};

export const PlanModel = Plan as unknown as {
    find: (query: Record<string, unknown>) => {
        lean: () => Promise<unknown[]>;
    };
};

export const WalletModel = UserWallet as unknown as {
    findOne: (query: Record<string, unknown>) => {
        lean: () => Promise<{ smartAlertSlots?: number } | null>;
    };
};

export const getRequiredAlertId = (req: Request): string => {
    const id = req.params.id;
    if (typeof id !== 'string' || !id.trim()) {
        throw new AppError('Invalid alert ID', 400, 'INVALID_ALERT_ID');
    }
    return id;
};

export const toAlertContract = (alert: unknown) => {
    const serialized = serializeDoc(alert) as SerializedSmartAlert;
    const serializedCriteria = (serialized.criteria ?? {}) as Record<string, unknown>;
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

export const normalizeSmartAlertLocationPayload = async (
    payload: SmartAlertPayload
) => {
    const criteria = payload.criteria && typeof payload.criteria === 'object'
        ? { ...payload.criteria }
        : {};

    const normalized = await normalizeLocation({
        locationId: (criteria as Record<string, unknown>).locationId,
        city: (criteria as Record<string, unknown>).location,
        state: (criteria as Record<string, unknown>).state,
        display: (criteria as Record<string, unknown>).location,
        coordinates: payload.coordinates
    });

    const explicitCoords = normalizeCoordinates(payload.coordinates);
    const effectiveCoords = explicitCoords || normalized?.coordinates;

    if (!effectiveCoords || (effectiveCoords.coordinates[0] === 0 && effectiveCoords.coordinates[1] === 0)) {
        throw new AppError('Valid map coordinates are required for Smart Alerts.', 400, 'INVALID_COORDINATES');
    }

    payload.coordinates = effectiveCoords;
    (criteria as Record<string, unknown>).coordinates = payload.coordinates;

    if (normalized?.locationId) {
        (criteria as Record<string, unknown>).locationId = normalized.locationId;
    }

    if (normalized?.display) {
        (criteria as Record<string, unknown>).location = normalized.display;
    }

    payload.criteria = criteria as SmartAlertCriteriaPayload;
};

export const buildAlertExpiry = () =>
    new Date(Date.now() + GOVERNANCE.SMART_ALERT.EXPIRY_DAYS * MS_IN_DAY);
