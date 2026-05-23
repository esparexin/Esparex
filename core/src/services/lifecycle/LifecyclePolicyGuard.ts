import { LISTING_STATUS } from '@esparex/shared';
import { ACTOR_TYPE, type ActorMetadata } from '@esparex/shared';

type ListingDomain = 'ad' | 'service' | 'spare_part_listing';

export type LifecycleMutationPolicyInput = {
    domain: string;
    fromStatus: string;
    toStatus: string;
    actor: ActorMetadata;
    patch?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
};

const toLower = (value: unknown) =>
    typeof value === 'string' ? value.trim().toLowerCase() : '';

const isListingDomain = (domain: string): domain is ListingDomain =>
    domain === 'ad' || domain === 'service' || domain === 'spare_part_listing';

const toPolicyError = (message: string, code: string, statusCode = 400) => {
    const error = new Error(message) as Error & { code?: string; statusCode?: number };
    error.code = code;
    error.statusCode = statusCode;
    return error;
};

export const enforceLifecycleMutationPolicy = (input: LifecycleMutationPolicyInput) => {
    const action = toLower(input.metadata?.action);

    if (action === 'hard_delete' || input.patch?.hardDelete === true) {
        throw toPolicyError('Hard delete is forbidden by lifecycle policy.', 'HARD_DELETE_FORBIDDEN', 400);
    }

    if (action === 'listing_edit' && Object.prototype.hasOwnProperty.call(input.patch || {}, 'expiresAt')) {
        throw toPolicyError('Editing a listing cannot mutate expiresAt.', 'EXPIRESAT_EDIT_FORBIDDEN', 400);
    }

    if (
        action === 'repost'
        && toLower(input.fromStatus) === LISTING_STATUS.EXPIRED
        && toLower(input.toStatus) === LISTING_STATUS.LIVE
    ) {
        throw toPolicyError('Repost from expired must transition to pending first.', 'REPOST_LIVE_FORBIDDEN', 400);
    }

    if (!isListingDomain(input.domain)) return;
    if (toLower(input.toStatus) !== LISTING_STATUS.LIVE) return;

    const fromStatus = toLower(input.fromStatus);
    const isReactivation = action === 'listing_activate' && fromStatus === LISTING_STATUS.DEACTIVATED;

    // 🛡️ POLICY: Only moderation approval or user reactivation of deactivated listings can go LIVE
    if (action !== 'moderation_approve' && !isReactivation) {
        throw toPolicyError('Live transition must be initiated by moderation approval.', 'LIVE_TRANSITION_REQUIRES_APPROVAL_ACTION', 400);
    }

    // 🛡️ POLICY: Only admins can approve, but users can reactivate their own deactivated listings
    // We permit USER actors here if isReactivation is true to allow owner reactivation.
    if (input.actor.type !== ACTOR_TYPE.ADMIN && !isReactivation) {
        throw toPolicyError('Only admin moderation may transition listing to live.', 'LIVE_TRANSITION_REQUIRES_ADMIN_ACTOR', 403);
    }

    // 🛡️ POLICY: Reactivation preserves existing metadata; moderation approval requires fresh timestamps
    if (isReactivation) return;

    const approvedAt = input.patch?.approvedAt;
    const expiresAt = input.patch?.expiresAt;

    if (!(approvedAt instanceof Date) || Number.isNaN(approvedAt.getTime())) {
        throw toPolicyError('Live transition requires approvedAt timestamp.', 'APPROVED_AT_REQUIRED', 400);
    }

    if (!(expiresAt instanceof Date) || Number.isNaN(expiresAt.getTime())) {
        throw toPolicyError('Live transition requires expiresAt timestamp.', 'EXPIRES_AT_REQUIRED', 400);
    }
};

export type ListingApprovedEventPayload = {
    listingId: string;
    listingType: string;
    approvedAt: string;
    actorType: string;
    actorId?: string;
    source: string;
};

export const assertListingApprovedEvent = (payload: unknown): ListingApprovedEventPayload => {
    const record = payload as Record<string, unknown>;
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
