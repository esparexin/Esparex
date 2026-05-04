"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MOBILE_VISIBILITY_VALUES = exports.MOBILE_VISIBILITY = void 0;
exports.normalizeMobileVisibility = normalizeMobileVisibility;
exports.MOBILE_VISIBILITY = {
    SHOW: "show",
    HIDE: "hide",
    ON_REQUEST: "on-request",
};
exports.MOBILE_VISIBILITY_VALUES = Object.values(exports.MOBILE_VISIBILITY);
function normalizeMobileVisibility(value, fallback = exports.MOBILE_VISIBILITY.SHOW) {
    if (value === exports.MOBILE_VISIBILITY.SHOW || value === exports.MOBILE_VISIBILITY.HIDE || value === exports.MOBILE_VISIBILITY.ON_REQUEST) {
        return value;
    }
    if (value === "public")
        return exports.MOBILE_VISIBILITY.SHOW;
    if (value === "private")
        return exports.MOBILE_VISIBILITY.HIDE;
    if (value === "contacts")
        return exports.MOBILE_VISIBILITY.ON_REQUEST;
    return fallback;
}
//# sourceMappingURL=mobileVisibility.js.map