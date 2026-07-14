import LocationEvent from '../../../../models/LocationEvent';
import { LocationEventRepositoryPort } from '../../../../domains/location';

export class MongoLocationEventRepositoryAdapter implements LocationEventRepositoryPort {
    public async createLocationEvent(payload: Record<string, unknown>): Promise<any> {
        return LocationEvent.create(payload);
    }
}
