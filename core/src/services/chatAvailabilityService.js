"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHAT_CLOSED_STATUSES = void 0;
exports.isListingChatClosed = isListingChatClosed;
exports.syncConversationAvailabilityForListing = syncConversationAvailabilityForListing;
const adStatus_1 = require("@core/constants/enums/adStatus");
const Conversation_1 = require("@core/models/Conversation");
const logger_1 = __importDefault(require("@core/utils/logger"));
exports.CHAT_CLOSED_STATUSES = new Set([
    adStatus_1.AD_STATUS.SOLD,
    adStatus_1.AD_STATUS.EXPIRED,
    adStatus_1.AD_STATUS.DEACTIVATED,
    adStatus_1.AD_STATUS.REJECTED,
    adStatus_1.AD_STATUS.DELETED,
    adStatus_1.AD_STATUS.SUSPENDED,
    adStatus_1.AD_STATUS.BANNED,
    adStatus_1.AD_STATUS.INACTIVE,
]);
const normalizeStatus = (value) => typeof value === 'string' ? value.trim().toLowerCase() : '';
function isListingChatClosed(listing) {
    if (!listing)
        return true;
    return Boolean(listing.isDeleted ||
        listing.isChatLocked ||
        exports.CHAT_CLOSED_STATUSES.has(normalizeStatus(listing.status)));
}
async function syncConversationAvailabilityForListing(listing, session) {
    const listingId = listing?._id != null ? String(listing._id) : '';
    if (!listingId)
        return;
    const isClosed = isListingChatClosed(listing);
    try {
        const query = Conversation_1.Conversation.updateMany({
            adId: listingId,
            isAdClosed: { $ne: isClosed },
        }, {
            $set: { isAdClosed: isClosed },
        });
        if (session) {
            query.session(session);
        }
        await query;
    }
    catch (error) {
        logger_1.default.error('[ChatAvailability] Failed to sync conversation availability', {
            listingId,
            isClosed,
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
}
//# sourceMappingURL=chatAvailabilityService.js.map