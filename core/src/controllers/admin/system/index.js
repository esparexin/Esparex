"use strict";
/**
 * Admin System Controller - Re-export Index
 * Maintains backward compatibility by re-exporting all functions
 * from the split admin controllers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocationAnalytics = exports.getRateLimitMetrics = exports.updateContactSubmissionStatus = exports.getContactSubmissions = exports.getRecentActivity = exports.getAnalytics = exports.getDashboardStats = exports.getStats = exports.applySystemFix = exports.runSystemScan = exports.getSystemHealth = exports.getCacheHealth = exports.logout = exports.login = exports.getMe = exports.adminLogout = exports.adminLogin = exports.resetPassword = exports.forgotPassword = void 0;
// Export all auth functions
var adminAuthController_1 = require("./adminAuthController");
Object.defineProperty(exports, "forgotPassword", { enumerable: true, get: function () { return adminAuthController_1.forgotPassword; } });
Object.defineProperty(exports, "resetPassword", { enumerable: true, get: function () { return adminAuthController_1.resetPassword; } });
Object.defineProperty(exports, "adminLogin", { enumerable: true, get: function () { return adminAuthController_1.adminLogin; } });
Object.defineProperty(exports, "adminLogout", { enumerable: true, get: function () { return adminAuthController_1.adminLogout; } });
Object.defineProperty(exports, "getMe", { enumerable: true, get: function () { return adminAuthController_1.getMe; } });
Object.defineProperty(exports, "login", { enumerable: true, get: function () { return adminAuthController_1.login; } });
Object.defineProperty(exports, "logout", { enumerable: true, get: function () { return adminAuthController_1.logout; } });
// Export all system health functions
var adminSystemHealthController_1 = require("./adminSystemHealthController");
Object.defineProperty(exports, "getCacheHealth", { enumerable: true, get: function () { return adminSystemHealthController_1.getCacheHealth; } });
Object.defineProperty(exports, "getSystemHealth", { enumerable: true, get: function () { return adminSystemHealthController_1.getSystemHealth; } });
Object.defineProperty(exports, "runSystemScan", { enumerable: true, get: function () { return adminSystemHealthController_1.runSystemScan; } });
Object.defineProperty(exports, "applySystemFix", { enumerable: true, get: function () { return adminSystemHealthController_1.applySystemFix; } });
// Export all dashboard functions
var adminDashboardController_1 = require("./adminDashboardController");
Object.defineProperty(exports, "getStats", { enumerable: true, get: function () { return adminDashboardController_1.getStats; } });
Object.defineProperty(exports, "getDashboardStats", { enumerable: true, get: function () { return adminDashboardController_1.getDashboardStats; } });
Object.defineProperty(exports, "getAnalytics", { enumerable: true, get: function () { return adminDashboardController_1.getAnalytics; } });
Object.defineProperty(exports, "getRecentActivity", { enumerable: true, get: function () { return adminDashboardController_1.getRecentActivity; } });
Object.defineProperty(exports, "getContactSubmissions", { enumerable: true, get: function () { return adminDashboardController_1.getContactSubmissions; } });
Object.defineProperty(exports, "updateContactSubmissionStatus", { enumerable: true, get: function () { return adminDashboardController_1.updateContactSubmissionStatus; } });
Object.defineProperty(exports, "getRateLimitMetrics", { enumerable: true, get: function () { return adminDashboardController_1.getRateLimitMetrics; } });
Object.defineProperty(exports, "getLocationAnalytics", { enumerable: true, get: function () { return adminDashboardController_1.getLocationAnalytics; } });
//# sourceMappingURL=index.js.map