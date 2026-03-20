import type { IAdmin } from "../../models/Admin";
import type { IAuthUser } from "../types/auth";

declare module 'express-serve-static-core' {
  interface Request {
    user?: IAuthUser;
    admin?: IAdmin;
  }
}

declare global { // Fallback for some configurations
  namespace Express {
    interface Request {
      user?: IAuthUser;
      admin?: IAdmin;
    }
  }
}

export { };
