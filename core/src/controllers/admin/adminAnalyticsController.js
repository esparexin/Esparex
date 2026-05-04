"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRevenueByCategory = exports.getRevenueSummary = exports.getTimeSeriesAnalytics = void 0;
const logger_1 = __importDefault(require("@esparex/core/utils/logger"));
const adminBaseController_1 = require("@esparex/core/utils/adminBaseController");
const analyticsService = __importStar(require("@esparex/core/services/AnalyticsService"));
const getQueryString = (value) => {
    if (typeof value === 'string')
        return value;
    if (Array.isArray(value) && typeof value[0] === 'string')
        return value[0];
    return undefined;
};
/**
 * Get time-series analytics data
 * Defaults to last 6 months
 */
const getTimeSeriesAnalytics = async (req, res) => {
    try {
        const result = await analyticsService.getTimeSeriesAnalytics(6);
        (0, adminBaseController_1.sendSuccessResponse)(res, result);
    }
    catch (error) {
        logger_1.default.error('Error fetching time-series analytics:', error);
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.getTimeSeriesAnalytics = getTimeSeriesAnalytics;
/**
 * Get aggregated revenue summary (Daily)
 */
const getRevenueSummary = async (req, res) => {
    try {
        const startDate = getQueryString(req.query.startDate);
        const endDate = getQueryString(req.query.endDate);
        const stats = await analyticsService.getRevenueSummary(startDate, endDate);
        (0, adminBaseController_1.sendSuccessResponse)(res, stats);
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.getRevenueSummary = getRevenueSummary;
/**
 * Get revenue breakdown by category
 */
const getRevenueByCategory = async (req, res) => {
    try {
        const startDate = getQueryString(req.query.startDate);
        const endDate = getQueryString(req.query.endDate);
        const categoryMap = await analyticsService.getRevenueByCategory(startDate, endDate);
        (0, adminBaseController_1.sendSuccessResponse)(res, categoryMap);
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.getRevenueByCategory = getRevenueByCategory;
//# sourceMappingURL=adminAnalyticsController.js.map