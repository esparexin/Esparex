import type { IAdmin } from '@esparex/core/models/Admin';
import type { IBusiness } from '@esparex/core/models/Business';
import type { IAuthUser } from '@esparex/core/types/auth';

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
        }
    }
}

export {};
