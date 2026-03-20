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
import logger from '../utils/logger';

if (process.env.NODE_ENV !== 'test' && process.env.STARTUP_VERBOSE === 'true') {
    logger.info('✅ Environment variables loaded and validated');
}

export default {};
