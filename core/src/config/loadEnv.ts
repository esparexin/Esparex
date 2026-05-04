import moduleAlias from 'module-alias';
import path from 'path';

// 🛡️ RUNTIME ALIAS RESOLUTION (SSOT)
// This ensures that @esparex/core and @esparex/shared aliases work in production (dist/) 
// without relying on fragile build-time tsc-alias replacements.
if (process.env.NODE_ENV === 'production' || process.env.NODE_PATH?.includes('dist')) {
    // Assuming this file is at [ROOT]/core/src/config/loadEnv.ts
    // In production dist, it's at [ROOT]/dist/core/src/config/loadEnv.js
    const distRoot = path.resolve(__dirname, '../../../');
    (moduleAlias as any).addAliases({
        '@esparex/core': path.join(distRoot, 'core/src'),
        '@esparex/shared': path.join(distRoot, 'shared')
    });
}

/**
 * Environment Loader
 * 
 * This module loads and validates environment variables using Zod.
 * Import this file FIRST in your application entry point.
 * 
 * The actual validation logic is in ./env.ts
 * This file maintains backward compatibility with existing imports.
 */

import './env'; // This will validate env vars on import and throw if invalid
import logger from '@esparex/core/utils/logger';

if (process.env.NODE_ENV !== 'test' && process.env.STARTUP_VERBOSE === 'true') {
    logger.info('✅ Environment variables loaded and validated');
}

export default {};
