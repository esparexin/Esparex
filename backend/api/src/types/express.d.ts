import type { IAdmin } from '@esparex/core';
import type { IBusiness } from '@esparex/core';
import type { IAuthUser } from '@esparex/core';

declare global {
    namespace Express {
        interface Request {
            user?: IAuthUser;
            admin?: IAdmin;
            business?: IBusiness;
            fraudRisk?: string;
            fraudScore?: number;
            riskState?: string;
            idempotencyKey?: string;
            requestId?: string;
            listing?: any;
            /** Raw request body Buffer, captured by the express.json() verify hook for HMAC webhook signature verification. */
            rawBody?: Buffer;
        }
    }
}

export {};
