// Public API for operational and governance tooling
export { governSchema, runStartupIndexAudit, resetIndexGovernanceForTests } from '../db/indexGovernance';
export { getIndexAuditTargets } from '../db/indexAuditTargets';
export { assertCriticalStartupReadiness, validateMetadataHealth } from '../infrastructure/process/startupValidator';
export { gracefulShutdown } from '../infrastructure/process/shutdownHandler';
export { startSystemMonitor } from '../infrastructure/telemetry/systemMonitor';
export { warmAllCaches } from '../infrastructure/cache/cacheWarmer';
export { getHealthCheckData, healthCheckHandler } from '../utils/health';
export { runWithDistributedJobLock } from '../infrastructure/redis/distributedJobLock';
