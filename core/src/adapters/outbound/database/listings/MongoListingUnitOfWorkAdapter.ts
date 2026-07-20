import { ListingUnitOfWorkPort } from '../../../../domains/listings';
import { MongoUnitOfWorkBase } from '../MongoUnitOfWorkBase';

export class MongoListingUnitOfWorkAdapter extends MongoUnitOfWorkBase implements ListingUnitOfWorkPort {}
