/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'domain-cannot-import-apps-or-services',
      severity: 'error',
      comment: 'Domain logic must not depend on apps or services.',
      from: { path: '^packages/domain/' },
      to: {
        path: '^(apps/|services/)'
      }
    },
    {
      name: 'kernel-is-independent',
      severity: 'error',
      comment: 'Kernel cannot depend on domains, apps, or services.',
      from: { path: '^packages/kernel/' },
      to: {
        path: '^(packages/domain/|apps/|services/)'
      }
    },
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
      name: 'validation-service-cannot-import-models-or-mongoose',
      severity: 'error',
      comment: 'CatalogValidationService must be completely decoupled from Mongoose and persistence models.',
      from: { path: '^core/src/services/catalog/CatalogValidationService\\.ts$' },
      to: {
        path: '(^core/src/models/Category|^core/src/models/Brand|^core/src/utils/CategoryQueryBuilder|mongoose)',
        dependencyTypesNot: ['type-only']
      }
    },
    {
      name: 'domain-cannot-import-infrastructure-or-adapters',
      severity: 'error',
      comment: 'Domain logic and ports must not depend on database adapters, infrastructure, or third-party drivers.',
      from: { path: '^core/src/domains/[^/]+/(domain|ports)' },
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
      name: 'no-legacy-transport-imports',
      severity: 'error',
      comment: 'Legacy transport paths are forbidden. Use local relative utilities inside backend/api instead.',
      from: {},
      to: {
        path: '(^backend/user|^@esparex/backend-user|^@esparex/core/controllers|^@esparex/core/utils/respond|^@esparex/core/utils/errorResponse|^@esparex/core/utils/controllerUtils)'
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
      name: 'platform-sdk-in-infrastructure-only',
      severity: 'error',
      comment: 'Native device SDKs (expo-image-picker, expo-camera, expo-notifications, expo-location) must be encapsulated in infrastructure adapters and never imported directly in presentation, application, or domain layers.',
      from: {
        path: '^apps/mobile/src/features/[^/]+/(presentation|domain|application)'
      },
      to: {
        path: '(expo-image-picker|expo-camera|expo-notifications|expo-location)'
      }
    }
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
