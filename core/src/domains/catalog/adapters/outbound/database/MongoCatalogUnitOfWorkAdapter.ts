import { CatalogUnitOfWorkPort } from '../../..';
import { MongoUnitOfWorkBase } from '../../../../../adapters/outbound/database/MongoUnitOfWorkBase';

export class MongoCatalogUnitOfWorkAdapter extends MongoUnitOfWorkBase implements CatalogUnitOfWorkPort {}
