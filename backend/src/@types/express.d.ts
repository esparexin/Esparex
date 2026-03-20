import { IUser } from "../models/User";

declare global {
    namespace Express {
        // IUser already carries all required fields for authenticated request context.
        interface User extends IUser {
            _id: IUser['_id'];
        }
        interface Request {
            admin?: Record<string, unknown>; // For admin auth context if specialized
        }
    }
}
