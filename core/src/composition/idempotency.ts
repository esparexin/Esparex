/**
 * Idempotency composition facade — Phase 3b (DECISION-GATE §5, areas/11 P-02).
 *
 * Backend request middleware consumes the idempotency repository through
 * this port-backed singleton, never the IdempotencyRequest Mongoose model.
 */
import { MongoIdempotencyRepositoryAdapter } from '../domains/idempotency/adapters/outbound/database/MongoIdempotencyRepositoryAdapter';
import type { IdempotencyRepositoryPort } from '../domains/idempotency/ports/IdempotencyRepositoryPort';

export const idempotencyRepository: IdempotencyRepositoryPort = new MongoIdempotencyRepositoryAdapter();
