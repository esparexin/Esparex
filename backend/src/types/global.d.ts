import type { IAdmin } from '../models/Admin';
import type { IBusiness } from '../models/Business';
import type { IAuthUser } from './auth';

declare global {
    namespace Express {
        interface Request {
            user?: IAuthUser;
            admin?: IAdmin;
            business?: IBusiness;
            idempotencyRecordId?: string;
            idempotencyKey?: string;
        }
    }
}

export { };
