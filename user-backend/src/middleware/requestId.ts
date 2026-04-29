import { traceMiddleware } from '@core/middleware/traceMiddleware';

/**
 * user-backend Trace Middleware Shim
 * Inherits SSOT implementation from @core
 */
export const requestIdMiddleware = traceMiddleware('user-backend');

export default requestIdMiddleware;
