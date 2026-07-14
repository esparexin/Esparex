import { MongoUserRepositoryAdapter } from '../adapters/outbound/database/identity/MongoUserRepositoryAdapter';
import { UserRepositoryPort } from '../domains/identity';

export const userRepository: UserRepositoryPort = new MongoUserRepositoryAdapter();
