"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSmartAlerts = void 0;
const logger_1 = __importDefault(require("@esparex/core/utils/logger"));
const respond_1 = require("@esparex/core/utils/respond");
const errorResponse_1 = require("@esparex/core/utils/errorResponse");
const shared_1 = require("./shared");
const getSmartAlerts = async (req, res) => {
    try {
        const user = req.user;
        const admin = req.admin;
        if (admin) {
            const alerts = await shared_1.SmartAlertModel.find({}).sort({ createdAt: -1 });
            return res.json((0, respond_1.respond)({
                success: true,
                data: alerts.map((alert) => (0, shared_1.toAlertContract)(alert))
            }));
        }
        if (user) {
            const userId = user.id || user._id;
            const alerts = await shared_1.SmartAlertModel.find({ userId }).sort({ createdAt: -1 });
            return res.json((0, respond_1.respond)({
                success: true,
                data: alerts.map((alert) => (0, shared_1.toAlertContract)(alert))
            }));
        }
        (0, errorResponse_1.sendErrorResponse)(req, res, 401, 'Unauthorized');
    }
    catch (error) {
        logger_1.default.error('Error fetching smart alerts:', error);
        (0, errorResponse_1.sendErrorResponse)(req, res, 500, (0, shared_1.getErrorMessage)(error));
    }
};
exports.getSmartAlerts = getSmartAlerts;
//# sourceMappingURL=smartAlertQueryController.js.map