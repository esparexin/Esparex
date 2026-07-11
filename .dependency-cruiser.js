/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
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
    }
  ],
  options: {
    doNotFollow: {
      path: 'node_modules'
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json'
    }
  }
};
