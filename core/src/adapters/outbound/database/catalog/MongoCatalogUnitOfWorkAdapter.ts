import { CatalogUnitOfWorkPort } from '../../../../domains/catalog';
import { MongoUnitOfWorkBase } from '../MongoUnitOfWorkBase';

export class MongoCatalogUnitOfWorkAdapter extends MongoUnitOfWorkBase implements CatalogUnitOfWorkPort {}
