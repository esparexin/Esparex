"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adjustWallet = void 0;
const adminLogger_1 = require("@esparex/core/utils/adminLogger");
const errorResponse_1 = require("@esparex/core/utils/errorResponse");
const adminBaseController_1 = require("@esparex/core/utils/adminBaseController");
const shared_1 = require("./shared");
const WalletService_1 = require("@esparex/core/services/WalletService");
const adjustWallet = async (req, res) => {
    try {
        const { userId, adCredits, spotlightCredits, smartAlertSlots } = req.body;
        if (!userId)
            return (0, errorResponse_1.sendErrorResponse)(req, res, 400, 'User ID is required');
        const incrementPayload = {};
        if (typeof adCredits === 'number')
            incrementPayload.adCredits = adCredits;
        if (typeof spotlightCredits === 'number')
            incrementPayload.spotlightCredits = spotlightCredits;
        if (typeof smartAlertSlots === 'number')
            incrementPayload.smartAlertSlots = smartAlertSlots;
        if (Object.keys(incrementPayload).length === 0) {
            return (0, errorResponse_1.sendErrorResponse)(req, res, 400, 'No adjustments provided');
        }
        const adminId = req.user?._id || 'system';
        const wallet = await (0, WalletService_1.credit)({
            userId,
            amount: incrementPayload,
            reason: `Admin Credit Adjustment`,
            metadata: {
                adminId,
                adjustment: incrementPayload
            }
        });
        // 🛡️ LOG ADMIN ACTION (Security Audit Trail)
        await (0, adminLogger_1.logAdminAction)(req, 'ADJUST_WALLET', 'User', userId, { adjustment: incrementPayload });
        (0, adminBaseController_1.sendSuccessResponse)(res, wallet, 'Wallet adjusted successfully');
    }
    catch (error) {
        (0, errorResponse_1.sendErrorResponse)(req, res, 500, (0, shared_1.getErrorMessage)(error));
    }
};
exports.adjustWallet = adjustWallet;
//# sourceMappingURL=walletMutationController.js.map