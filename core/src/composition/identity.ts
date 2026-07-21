import { MongoUserRepositoryAdapter } from '../adapters/outbound/database/identity/MongoUserRepositoryAdapter';

// Type is inferred from the concrete adapter — structurally satisfies UserRepositoryPort.
// Removing the explicit import breaks the composition → barrel → service → composition cycle.
export const userRepository = new MongoUserRepositoryAdapter();

