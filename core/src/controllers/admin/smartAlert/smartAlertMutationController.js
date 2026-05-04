"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleSmartAlertStatus = exports.deleteSmartAlert = exports.updateSmartAlert = exports.createSmartAlert = void 0;
const respond_1 = require("@esparex/core/utils/respond");
const errorResponse_1 = require("@esparex/core/utils/errorResponse");
const AppError_1 = require("@esparex/core/utils/AppError");
const shared_1 = require("./shared");
const SmartAlertMutationService_1 = require("@esparex/core/services/smartAlert/SmartAlertMutationService");
const sendSmartAlertError = (req, res, error) => {
    const appError = error instanceof AppError_1.AppError ? error : null;
    (0, errorResponse_1.sendErrorResponse)(req, res, appError?.statusCode ?? 400, (0, shared_1.getErrorMessage)(error), {
        ...(appError?.code ? { code: appError.code } : {}),
        ...(appError?.details !== undefined ? { details: appError.details } : {}),
    });
};
const createSmartAlert = async (req, res) => {
    try {
        const alert = await (0, SmartAlertMutationService_1.createSmartAlertMutation)({
            user: req.user,
            body: req.body,
        });
        res.status(201).json((0, respond_1.respond)({
            success: true,
            data: (0, shared_1.toAlertContract)(alert),
        }));
    }
    catch (error) {
        sendSmartAlertError(req, res, error);
    }
};
exports.createSmartAlert = createSmartAlert;
const updateSmartAlert = async (req, res) => {
    try {
        const alert = await (0, SmartAlertMutationService_1.updateSmartAlertMutation)({
            alertId: (0, shared_1.getRequiredAlertId)(req),
            user: req.user,
            body: req.body,
        });
        res.json((0, respond_1.respond)({
            success: true,
            message: 'Alert updated successfully',
            data: (0, shared_1.toAlertContract)(alert),
        }));
    }
    catch (error) {
        sendSmartAlertError(req, res, error);
    }
};
exports.updateSmartAlert = updateSmartAlert;
const deleteSmartAlert = async (req, res) => {
    try {
        const result = await (0, SmartAlertMutationService_1.deleteSmartAlertMutation)({
            alertId: (0, shared_1.getRequiredAlertId)(req),
            user: req.user,
            admin: req.admin,
        });
        res.json((0, respond_1.respond)({
            success: true,
            message: 'Alert deleted successfully',
            data: result,
        }));
    }
    catch (error) {
        sendSmartAlertError(req, res, error);
    }
};
exports.deleteSmartAlert = deleteSmartAlert;
const toggleSmartAlertStatus = async (req, res) => {
    try {
        const alert = await (0, SmartAlertMutationService_1.toggleSmartAlertStatusMutation)({
            alertId: (0, shared_1.getRequiredAlertId)(req),
            user: req.user,
        });
        res.json((0, respond_1.respond)({
            success: true,
            message: `Alert ${alert.isActive ? 'activated' : 'deactivated'} successfully`,
            data: (0, shared_1.toAlertContract)(alert),
        }));
    }
    catch (error) {
        sendSmartAlertError(req, res, error);
    }
};
exports.toggleSmartAlertStatus = toggleSmartAlertStatus;
//# sourceMappingURL=smartAlertMutationController.js.map