"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertListingApprovedEvent = exports.enforceLifecycleMutationPolicy = void 0;
const adStatus_1 = require("@core/constants/enums/adStatus");
const actor_1 = require("@core/constants/enums/actor");
const toLower = (value) => typeof value === 'string' ? value.trim().toLowerCase() : '';
const isListingDomain = (domain) => domain === 'ad' || domain === 'service' || domain === 'spare_part_listing';
const toPolicyError = (message, code, statusCode = 400) => {
    const error = new Error(message);
    error.code = code;
    error.statusCode = statusCode;
    return error;
};
const enforceLifecycleMutationPolicy = (input) => {
    const action = toLower(input.metadata?.action);
    if (action === 'hard_delete' || input.patch?.hardDelete === true) {
        throw toPolicyError('Hard delete is forbidden by lifecycle policy.', 'HARD_DELETE_FORBIDDEN', 400);
    }
    if (action === 'listing_edit' && Object.prototype.hasOwnProperty.call(input.patch || {}, 'expiresAt')) {
        throw toPolicyError('Editing a listing cannot mutate expiresAt.', 'EXPIRESAT_EDIT_FORBIDDEN', 400);
    }
    if (action === 'repost'
        && toLower(input.fromStatus) === adStatus_1.AD_STATUS.EXPIRED
        && toLower(input.toStatus) === adStatus_1.AD_STATUS.LIVE) {
        throw toPolicyError('Repost from expired must transition to pending first.', 'REPOST_LIVE_FORBIDDEN', 400);
    }
    if (!isListingDomain(input.domain))
        return;
    if (toLower(input.toStatus) !== adStatus_1.AD_STATUS.LIVE)
        return;
    if (action !== 'moderation_approve') {
        throw toPolicyError('Live transition must be initiated by moderation approval.', 'LIVE_TRANSITION_REQUIRES_APPROVAL_ACTION', 400);
    }
    if (input.actor.type !== actor_1.ACTOR_TYPE.ADMIN) {
        throw toPolicyError('Only admin moderation may transition listing to live.', 'LIVE_TRANSITION_REQUIRES_ADMIN_ACTOR', 403);
    }
    const approvedAt = input.patch?.approvedAt;
    const expiresAt = input.patch?.expiresAt;
    if (!(approvedAt instanceof Date) || Number.isNaN(approvedAt.getTime())) {
        throw toPolicyError('Live transition requires approvedAt timestamp.', 'APPROVED_AT_REQUIRED', 400);
    }
    if (!(expiresAt instanceof Date) || Number.isNaN(expiresAt.getTime())) {
        throw toPolicyError('Live transition requires expiresAt timestamp.', 'EXPIRES_AT_REQUIRED', 400);
    }
};
exports.enforceLifecycleMutationPolicy = enforceLifecycleMutationPolicy;
const assertListingApprovedEvent = (payload) => {
    const record = payload;
    const listingId = typeof record?.listingId === 'string' ? record.listingId : '';
    const listingType = typeof record?.listingType === 'string' ? record.listingType : '';
    const approvedAt = typeof record?.approvedAt === 'string' ? record.approvedAt : '';
    const actorType = typeof record?.actorType === 'string' ? record.actorType : '';
    const source = typeof record?.source === 'string' ? record.source : '';
    if (!listingId || !listingType || !approvedAt || !actorType || !source) {
        throw toPolicyError('Invalid listing.approved event payload.', 'INVALID_LISTING_APPROVED_EVENT', 500);
    }
    return {
        listingId,
        listingType,
        approvedAt,
        actorType,
        actorId: typeof record.actorId === 'string' ? record.actorId : undefined,
        source,
    };
};
exports.assertListingApprovedEvent = assertListingApprovedEvent;
//# sourceMappingURL=LifecyclePolicyGuard.js.map