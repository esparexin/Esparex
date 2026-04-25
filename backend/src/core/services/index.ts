/**
 * @core/services — aggregate barrel
 *
 * Re-exports all services that form the Esparex shared core.
 * Canonical implementations remain in backend/src/services/.
 *
 * Named re-exports are preferred over wildcard (*) here to keep the
 * public surface explicit and avoid accidental symbol shadowing.
 *
 * Import individual modules for tree-shaking:
 *   import { mutateStatus } from '@core/services/StatusMutationService';
 *
 * Or import everything from the aggregate:
 *   import { mutateStatus, validateTransition } from '@core/services';
 */

// Lifecycle
export * from './StatusMutationService';
export * from './LifecycleGuard';

// Ad creation pipeline
export * from './AdOrchestrator';
export * from './AdDuplicateService';
export * from './AdMutationService';

// Risk
export * from './FraudDetectionService';
