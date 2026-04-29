const moduleAlias = require('module-alias');
const path = require('path');

// ESPAREX MONOREPO RUNTIME ALIAS CONFIGURATION
// This file is the Single Source of Truth for backend alias resolution.
// It is used in production (dist) and development (src).

const projectRoot = path.resolve(__dirname, '..');

moduleAlias.addAliases({
    '@core': path.join(projectRoot, 'core/dist'),
    '@shared': path.join(projectRoot, 'shared/dist'),
});

// Log registration only in verbose mode or development
if (process.env.DEBUG_ALIAS === 'true') {
    console.log('[Alias] Registered @core ->', path.join(projectRoot, 'core/dist'));
    console.log('[Alias] Registered @shared ->', path.join(projectRoot, 'shared/dist'));
}
