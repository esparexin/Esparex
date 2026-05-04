"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListingSubmissionPolicy = void 0;
const AdSlotService_1 = require("./AdSlotService");
/**
 * ListingSubmissionPolicy
 * SSOT for slot deduction across all listing types.
 */
class ListingSubmissionPolicy {
    static async reserveSlot(input) {
        if (input.actor === 'admin') {
            return { source: 'admin_bypass' };
        }
        const result = await AdSlotService_1.AdSlotService.consumeSlot(input.userId, input.session, input.listingId);
        return { source: result.source };
    }
}
exports.ListingSubmissionPolicy = ListingSubmissionPolicy;
//# sourceMappingURL=ListingSubmissionPolicy.js.map