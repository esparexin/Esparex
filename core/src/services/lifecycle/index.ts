/**
 * @deprecated P1-4 (DECISION-GATE §2/§4): listings lifecycle logic merged into
 * the listings domain. Canonical: `core/src/domains/listings/application/lifecycle/`.
 * This barrel is a compatibility shim; it will be deleted in Phase 4.
 * Do not import from new code.
 */
export * from '../../domains/listings/application/lifecycle/index';
// ModerationEngine stays on the P1-7 moderation-pipeline shim (separate domain).
export * as ModerationEngine from './ModerationService';
export * from './ModerationService';
