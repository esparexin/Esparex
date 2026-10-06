/**
 * ESPAREX — listings/application/lifecycle/index.ts
 *
 * Canonical barrel for the listings lifecycle cluster (P1-4, DECISION-GATE §2).
 * The legacy `core/src/services/lifecycle/` modules are @deprecated shims
 * re-exporting these canonical implementations (deleted in Phase 4).
 */
export * as TransitionEngine from './StatusMutationService';
export * as AdLifecycleFacade from './AdStatusService';
export * as ExpiryEngine from './ListingExpiryService';
export * from './StatusMutationService';
export * from './AdStatusService';
export * from './ListingExpiryService';
export * from './LifecycleGuard';
export * from './LifecyclePolicyGuard';
