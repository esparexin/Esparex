import { Types } from 'mongoose';
import LocationEvent, { ILocationEvent } from '../../models/LocationEvent';

interface CreateLocationEventInput {
    source?: string;
    city?: string;
    state?: string;
    coordinates?: { type: 'Point'; coordinates: [number, number] };
    reason?: string;
    userId?: Types.ObjectId | string;
}

export async function createLocationEvent(input: CreateLocationEventInput): Promise<ILocationEvent> {
    const userId =
        typeof input.userId === 'string' ? new Types.ObjectId(input.userId) : input.userId;

    const payload: Record<string, unknown> = {
        source: input.source,
        city: input.city,
        state: input.state,
        coordinates: input.coordinates,
        reason: input.reason,
    };

    if (userId) {
        payload.userId = userId;
    }

    return LocationEvent.create(payload);
}
