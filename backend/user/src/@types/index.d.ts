import type { IAdmin } from '@esparex/core/models';;;
import type { IAuthUser } from '@esparex/core/types';;

declare module 'express-serve-static-core' {
  interface Request {
    user?: IAuthUser;
    admin?: IAdmin;
    business?: unknown;
    listing?: any;
  }
}

declare global { // Fallback for some configurations
  namespace Express {
    interface Request {
      user?: IAuthUser;
      admin?: IAdmin;
      business?: unknown;
      listing?: any;
    }
  }
}

export { };
