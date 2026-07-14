import LocationEvent, { type ILocationEvent } from '../../../../models/LocationEvent';
import { LocationEventRepositoryPort } from '../../../../domains/location';

export class MongoLocationEventRepositoryAdapter implements LocationEventRepositoryPort {
    public async createLocationEvent(payload: Partial<ILocationEvent>): Promise<ILocationEvent> {
        return LocationEvent.create(payload) as unknown as Promise<ILocationEvent>;
    }
}
