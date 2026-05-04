"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_STATUS_VALUES = exports.USER_STATUS = void 0;
const lifecycle_1 = require("./lifecycle");
/**
 * User Status Enum — Single Source of Truth
 */
exports.USER_STATUS = {
    LIVE: lifecycle_1.LIFECYCLE_STATUS.LIVE,
    SUSPENDED: lifecycle_1.LIFECYCLE_STATUS.SUSPENDED,
    BANNED: lifecycle_1.LIFECYCLE_STATUS.BANNED,
    DELETED: lifecycle_1.LIFECYCLE_STATUS.DELETED,
    INACTIVE: lifecycle_1.LIFECYCLE_STATUS.INACTIVE,
};
/** Tuple of all valid user status values */
exports.USER_STATUS_VALUES = Object.values(exports.USER_STATUS);
//# sourceMappingURL=userStatus.js.map