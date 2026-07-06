/**
 * Architecture Dependency Matrix — Single Source of Truth
 * =========================================================
 * Architecture Version: v1.1.0
 *
 * ALL dependency rules for the Esparex monorepo are defined here.
 * The dependency-cruiser config (.dependency-cruiser.cjs) and the
 * ESLint Boundaries config fragment are both GENERATED from this file.
 *
 * DO NOT author rules directly in .dependency-cruiser.cjs or eslint.config.mjs.
 * Instead, update this file and regenerate.
 *
 * To regenerate:
 *   node scripts/architecture/generate-depcruiser.js
 *   node scripts/architecture/generate-eslint-boundaries.js
 */

'use strict';

// ─── Package Layer Definitions ────────────────────────────────────────────────

/**
 * Top-level package layers in dependency order (consumers first, foundations last).
 * Each entry defines a zone used by both dependency-cruiser and ESLint boundaries.
 */
const PACKAGE_LAYERS = [
  { id: 'apps-web',    label: 'Web App',       pathPattern: '^apps/web/src/' },
  { id: 'apps-admin',  label: 'Admin App',     pathPattern: '^apps/admin/src/' },
  { id: 'backend',     label: 'Backend API',   pathPattern: '^backend/user/src/' },
  { id: 'core',        label: 'Core Package',  pathPattern: '^core/src/' },
  { id: 'shared',      label: 'Shared',        pathPattern: '^shared/src/' },
];

// ─── Core Internal Namespace Definitions ──────────────────────────────────────

/**
 * Namespaces INSIDE core/src.
 * Each entry maps to a subdirectory and a set of allowed dependencies.
 */
const CORE_NAMESPACES = [
  {
    id: 'core-types',
    label: 'Core Types',
    pathPattern: '^core/src/types/',
    allowedFrom: [], // Foundation layer — nothing internal is allowed to import INTO types except nothing; types can be imported by anyone.
  },
  {
    id: 'core-config',
    label: 'Core Config',
    pathPattern: '^core/src/config/',
    allowedFrom: [],
  },
  {
    id: 'core-domain',
    label: 'Core Domain',
    pathPattern: '^core/src/domain/',
    allowedDeps: ['core/src/types'],
    forbiddenDeps: ['core/src/config', 'core/src/models', 'core/src/services',
                    'core/src/infrastructure', 'core/src/tooling', 'core/src/jobs',
                    'core/src/queues', 'core/src/workers', 'core/src/utils'],
  },
  {
    id: 'core-utils',
    label: 'Core Utils',
    pathPattern: '^core/src/utils/',
    allowedDeps: ['core/src/types', 'core/src/config'],
    forbiddenDeps: ['core/src/domain', 'core/src/models', 'core/src/services',
                    'core/src/infrastructure', 'core/src/tooling',
                    'core/src/jobs', 'core/src/queues', 'core/src/workers'],
  },
  {
    id: 'core-validators',
    label: 'Core Validators',
    pathPattern: '^core/src/validators/',
    allowedDeps: ['core/src/types', 'core/src/domain'],
    forbiddenDeps: ['core/src/models', 'core/src/services', 'core/src/infrastructure',
                    'core/src/tooling', 'core/src/jobs', 'core/src/queues', 'core/src/workers'],
  },
  {
    id: 'core-events',
    label: 'Core Events',
    pathPattern: '^core/src/events/',
    allowedDeps: ['core/src/domain', 'core/src/types'],
    forbiddenDeps: ['core/src/services', 'core/src/infrastructure', 'core/src/models',
                    'core/src/tooling', 'core/src/jobs', 'core/src/queues', 'core/src/workers'],
  },
  {
    id: 'core-models',
    label: 'Core Models',
    pathPattern: '^core/src/models/',
    allowedDeps: ['core/src/domain', 'core/src/types', 'core/src/config'],
    forbiddenDeps: ['core/src/services', 'core/src/infrastructure', 'core/src/tooling',
                    'core/src/jobs', 'core/src/queues', 'core/src/workers'],
  },
  {
    id: 'core-infrastructure',
    label: 'Core Infrastructure',
    pathPattern: '^core/src/infrastructure/',
    allowedDeps: ['core/src/config', 'core/src/utils'],
    forbiddenDeps: ['core/src/services', 'core/src/domain', 'core/src/models',
                    'core/src/tooling', 'core/src/jobs', 'core/src/queues', 'core/src/workers'],
  },
  {
    id: 'core-tooling',
    label: 'Core Tooling',
    pathPattern: '^core/src/tooling/',
    allowedDeps: ['core/src/infrastructure', 'core/src/config', 'core/src/utils'],
    forbiddenDeps: ['core/src/services', 'core/src/domain', 'core/src/models',
                    'core/src/jobs', 'core/src/queues', 'core/src/workers'],
  },
  {
    id: 'core-services',
    label: 'Core Services',
    pathPattern: '^core/src/services/',
    allowedDeps: ['core/src/models', 'core/src/domain', 'core/src/validators',
                  'core/src/utils', 'core/src/events', 'core/src/infrastructure', 'core/src/config'],
    forbiddenDeps: ['core/src/tooling', 'core/src/jobs', 'core/src/queues', 'core/src/workers'],
  },
  {
    id: 'core-queues',
    label: 'Core Queues',
    pathPattern: '^core/src/queues/',
    allowedDeps: ['core/src/infrastructure'],
    forbiddenDeps: ['core/src/services', 'core/src/models', 'core/src/domain',
                    'core/src/tooling', 'core/src/jobs', 'core/src/workers'],
  },
  {
    id: 'core-jobs',
    label: 'Core Jobs',
    pathPattern: '^core/src/jobs/',
    allowedDeps: ['core/src/services', 'core/src/infrastructure'],
    forbiddenDeps: ['core/src/tooling', 'core/src/queues', 'core/src/workers'],
  },
  {
    id: 'core-workers',
    label: 'Core Workers',
    pathPattern: '^core/src/workers/',
    allowedDeps: ['core/src/queues', 'core/src/services'],
    forbiddenDeps: ['core/src/tooling', 'core/src/jobs'],
  },
];

// ─── Package-level Cross-boundary Rules ───────────────────────────────────────

/**
 * Rules governing imports between top-level packages.
 * These are absolute: no exception process applies here.
 */
const PACKAGE_BOUNDARY_RULES = [
  // Apps must only consume @esparex/shared, and @esparex/core/types + @esparex/core/domain
  {
    id: 'apps-no-core-internals',
    severity: 'error',
    from: { pathPattern: '^apps/' },
    forbidden: { pathPattern: '^core/src/(?!types|domain)' },
    message: 'App packages may only import from @esparex/shared, @esparex/core/types, and @esparex/core/domain.',
  },
  // Core must not import from backend or apps
  {
    id: 'core-no-consumers',
    severity: 'error',
    from: { pathPattern: '^core/src/' },
    forbidden: { pathPattern: '^(backend|apps)/' },
    message: 'Core must not import from backend or apps.',
  },
  // Shared must not import from core, backend, or apps
  {
    id: 'shared-isolation',
    severity: 'error',
    from: { pathPattern: '^shared/src/' },
    forbidden: { pathPattern: '^(core|backend|apps)/' },
    message: 'Shared must remain isomorphic — no imports from core, backend, or apps.',
  },
  // Backend must not import core internals (only public namespaces via @esparex/core/*)
  {
    id: 'backend-no-core-internals',
    severity: 'error',
    from: { pathPattern: '^backend/' },
    forbidden: { pathPattern: '^core/src/' },
    message: 'Backend must import from @esparex/core/* namespaces only, not core/src internals.',
  },
];

// ─── Exception Registry ────────────────────────────────────────────────────────

/**
 * All architectural exceptions must be registered here with a justification.
 * No inline silencing (e.g., /* depcruise-ignore *\/) is accepted without
 * a corresponding entry in this list.
 *
 * Format:
 *   { ruleId, from, to, justification, approvedDate, approvedBy }
 */
const EXCEPTIONS = [
  // Example (currently empty — the v1.0 migration eliminated all violations):
  // {
  //   ruleId: 'core-infrastructure-no-services',
  //   from: 'core/src/infrastructure/telemetry/reliabilityAlerts.ts',
  //   to: 'core/src/services/EmailService.ts',
  //   justification: 'Dynamic require breaks the static import cycle. Lazy-loaded at call time only.',
  //   approvedDate: '2026-07-06',
  //   approvedBy: 'Platform Team',
  // },
];

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  PACKAGE_LAYERS,
  CORE_NAMESPACES,
  PACKAGE_BOUNDARY_RULES,
  EXCEPTIONS,
  ARCHITECTURE_VERSION: 'v1.1.0',
};
