/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-upstream-core-to-api',
      severity: 'error',
      comment: 'Core package must never import from the API/delivery package or frontend apps.',
      from: { path: '^core/src' },
      to: {
        path: '^(backend/user|apps/web|apps/admin|@esparex/backend-user|@esparex/apps-admin|@esparex/apps-web)',
        dependencyTypesNot: ['type-only']
      }
    },
    {
      name: 'no-express-in-core',
      severity: 'error',
      comment: 'Core package must remain framework-independent. Express imports are forbidden.',
      from: { path: '^core/src' },
      to: {
        path: 'express',
        dependencyTypesNot: ['type-only']
      }
    },
    {
      name: 'no-direct-model-imports-in-controllers',
      severity: 'error',
      comment: 'Controllers in the API package must interact with models only via core services or orchestrators.',
      from: { path: '^backend/user/src/controllers' },
      to: {
        path: '^core/src/models',
        dependencyTypesNot: ['type-only']
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
