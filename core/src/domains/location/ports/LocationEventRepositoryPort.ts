import type { ILocationEvent } from '../../../models/LocationEvent';

/**
 * @todo ARCH-118: Transitional dependency on Mongoose.
 */
export interface LocationEventRepositoryPort {
    createLocationEvent(payload: Partial<ILocationEvent>): Promise<ILocationEvent>;
}
