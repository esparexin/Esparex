import type { IAdmin } from '@core/models/Admin';
import type { IBusiness } from '@core/models/Business';
import type { IAuthUser } from '@core/types/auth';

declare global {
    namespace Express {
        interface Request {
            user?: IAuthUser;
            admin?: IAdmin;
            business?: IBusiness;
            idempotencyRecordId?: string;
            idempotencyKey?: string;
            requestId?: string;
        }
    }
}

export { };
