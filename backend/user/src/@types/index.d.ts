import type { IAdmin } from "@esparex/core/models/Admin";
import type { IAuthUser } from "@esparex/core/types/auth";

declare module 'express-serve-static-core' {
  interface Request {
    user?: IAuthUser;
    admin?: IAdmin;
    business?: unknown;
  }
}

declare global { // Fallback for some configurations
  namespace Express {
    interface Request {
      user?: IAuthUser;
      admin?: IAdmin;
      business?: unknown;
    }
  }
}

export { };
