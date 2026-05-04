"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeUserStatus = normalizeUserStatus;
exports.isActiveUserStatus = isActiveUserStatus;
const userStatus_1 = require("../enums/userStatus");
const LEGACY_ACTIVE_STATUS = "active";
const validUserStatuses = new Set(userStatus_1.USER_STATUS_VALUES);
function normalizeUserStatus(status) {
    if (typeof status !== "string") {
        return undefined;
    }
    return validUserStatuses.has(status) ? status : undefined;
}
function isActiveUserStatus(status) {
    return normalizeUserStatus(status) === userStatus_1.USER_STATUS.LIVE;
}
//# sourceMappingURL=userStatus.js.map