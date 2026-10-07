/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'contracts-is-independent',
      severity: 'error',
      comment: 'Contracts cannot depend on domains, apps, services, shared, core, or backend packages.',
      from: { path: '^packages/contracts/' },
      to: {
        path: '^(packages/(?!contracts)|apps/|shared/|core/|backend/)'
      }
    },
    {
      name: 'domain-cannot-import-infrastructure-or-adapters',
      severity: 'error',
      comment: 'Domain logic and ports must not depend on database adapters, infrastructure, or third-party drivers. DECISION-GATE C-7: widened to all of core/src/domains/ (was: domain|ports only). Existing violations are grandfathered with a burn-down baseline in scripts/policy/domain-boundary-baseline.json (enforced by DEP-001 dependency-validator).',
      from: { path: '^core/src/domains/' },
      to: {
        path: '(^core/src/adapters|^core/src/infrastructure|mongoose|express|ioredis|redis|cloudinary|razorpay)',
        dependencyTypesNot: ['type-only']
      }
    },
    {
      name: 'ports-only-import-entities-and-types',
      severity: 'error',
      comment: 'Ports are pure domain interfaces and must never depend on implementation layers like models, services, controllers, adapters, or infrastructure.',
      from: { path: '^core/src/domains/[^/]+/ports' },
      to: {
        path: '(^core/src/adapters|^core/src/infrastructure|^core/src/models|^core/src/services|^backend/|^apps/|mongoose|express|ioredis|redis|cloudinary|razorpay)',
        dependencyTypesNot: ['type-only']
      }
    },
    {
      name: 'no-external-deep-imports-to-domain-internals',
      severity: 'error',
      comment: 'Non-domain modules must only import from the public domain barrel files, never directly from internal domain directories.',
      from: {
        path: '^core/src/(?!domains/)'
      },
      to: {
        path: '^core/src/domains/[^/]+/(domain|ports)/',
        dependencyTypesNot: ['type-only']
      }
    },
    {
      name: 'no-cross-domain-deep-imports',
      severity: 'error',
      comment: 'Cross-domain imports must go through the public domain barrel files, never directly to internal directories of other domains.',
      from: { path: '^core/src/domains/([^/]+)/' },
      to: {
        path: '^core/src/domains/(?!$1/)[^/]+/(domain|ports)/',
        dependencyTypesNot: ['type-only']
      }
    },
    {
      name: 'no-upstream-core-to-api',
      severity: 'error',
      comment: 'Core package must never import from the API/delivery package or frontend apps.',
      from: { path: '^core/src' },
      to: {
        path: '^(backend/|apps/|@esparex/backend-|@esparex/apps-)',
        dependencyTypesNot: ['type-only']
      }
    },
    {
      name: 'no-direct-model-imports-in-controllers',
      severity: 'error',
      comment: 'Controllers in the API package must interact with models only via core services or orchestrators.',
      from: { path: '^backend/[^/]+/src/controllers' },
      to: {
        path: '(^core/src/models|^@esparex/core/models)',
        dependencyTypesNot: ['type-only']
      }
    },
    {
      name: 'controllers-via-composition-facades',
      severity: 'error',
      comment: 'DECISION-GATE C-11: controllers must import core capabilities only via the @esparex/core root barrel (which carries the composition facades) or per-domain public barrels — never deep domain internals, services, or models. The single pre-existing deep import is grandfathered with a burn-down baseline in scripts/policy/domain-boundary-baseline.json (enforced by DEP-001 dependency-validator).',
      from: { path: '^backend/[^/]+/src/controllers' },
      to: {
        path: '(^core/src/domains/[^/]+/(domain|application|ports|adapters|mappers|classifiers|pipeline|policy|diagnostics)/|^core/src/services/|^core/src/models/)',
        dependencyTypesNot: ['type-only']
      }
    },
    {
      name: 'no-frontend-imports-from-core',
      severity: 'error',
      comment: 'Frontend apps must never import from @esparex/core. Use @esparex/contracts for cross-platform contracts.',
      from: { path: '^apps/' },
      to: {
        path: '^(core/|@esparex/core)',
        dependencyTypesNot: ['type-only']
      }
    },
    {
      name: 'no-shared-imports-from-core',
      severity: 'error',
      comment: 'The @esparex/shared package must never import from @esparex/core — shared has no knowledge of backend infrastructure.',
      from: { path: '^shared/' },
      to: {
        path: '^(core/|@esparex/core)',
        dependencyTypesNot: ['type-only']
      }
    },
    {
      name: 'no-new-legacy-shared-imports',
      severity: 'warn',
      comment: 'Shared domain utilities are permitted in @esparex/shared. All API wire contracts, DTOs, and request/response models must be imported exclusively from @esparex/contracts.',
      from: {
        pathNot: '^shared/src/'
      },
      to: {
        path: '^shared/src/'
      }
    },
    {
      name: 'no-deep-imports-into-packages',
      severity: 'error',
      comment: 'External consumers must use package root barrels (resolving to packages/<pkg>/src/index.ts), never deeper src/ subpaths (audit C1). Intra-package barrel chains are exempt.',
      from: {
        pathNot: '^packages/(mobile-ui|ui|contracts|shared)/'
      },
      to: {
        path: '^packages/(mobile-ui|ui|contracts|shared)/src/(?!index\\.tsx?$).+'
      }
    },
  ],
  options: {
    exclude: {
      path: '(^|/)(dist|build|coverage|\\.next|node_modules|\\.eslintcache)($|/)'
    },
    doNotFollow: {
      path: 'node_modules'
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json'
    }
  }
};
