import type { ClientSession } from 'mongoose';
import { AdSlotService, type AdPostingSlotSource } from '../../../../services/AdSlotService';
import { LISTING_TYPE, type ListingTypeValue } from '@esparex/contracts';
import { checkPostLimit } from '../../../../services/PlanService';
import type { ListingRepositoryPort } from '../../../../domains/listings';

/** @deprecated Use ListingTypeValue from shared/enums/listingType */
export type SubmissionListingType = ListingTypeValue;

export type ListingSubmissionReservation = {
    source: AdPostingSlotSource | 'admin_bypass';
};

export type ListingSubmissionPolicyInput = {
    userId: string;
    listingType: ListingTypeValue;
    listingId?: string;
    session?: ClientSession;
    actor: 'user' | 'admin';
};

/**
 * ListingSubmissionPolicy
 * SSOT for slot deduction across all listing types.
 *
 * Accepts an optional ListingRepositoryPort for future use in counting
 * active listings via the repository interface instead of delegating
 * to PlanService.checkPostLimit. Currently keeps the pre-port delegation
 * behavior for stability. The port-based counting will be enabled in PR-E
 * alongside PlanService refactoring.
 */
export class ListingSubmissionPolicy {
    constructor(private readonly listingRepo?: ListingRepositoryPort) {}

    async reserveSlot(input: ListingSubmissionPolicyInput): Promise<ListingSubmissionReservation> {
        if (input.actor === 'admin') {
            return { source: 'admin_bypass' };
        }

        // 🎯 SSOT: Distinguish between Credit-based (Ads) and Limit-based (Services/Parts)
        if (input.listingType === LISTING_TYPE.AD) {
            const result = await AdSlotService.consumeSlot(
                input.userId,
                input.session,
                input.listingId
            );
            return { source: result.source };
        }

        // For Services and Spare Parts, enforce active inventory limits
        // defined in the user's plan. Delegates to PlanService for the
        // lock, plan lookup, permission calculation, and limit enforcement.
        // TODO(PR-E): Replace with ListingRepositoryPort.countActiveBySeller()
        //             after extracting a PlanPort for limit checking.
        const type = input.listingType === LISTING_TYPE.SERVICE
            ? 'service'
            : 'spare_part_listing';

        await checkPostLimit(input.userId, type, input.session);

        return { source: 'active_slot_limit' };
    }

    // ── Legacy singleton (same pattern as CatalogValidationService) ──

    static #defaultInstance?: ListingSubmissionPolicy;

    static async reserveSlot(input: ListingSubmissionPolicyInput): Promise<ListingSubmissionReservation> {
        if (!ListingSubmissionPolicy.#defaultInstance) {
            const { getListingRepository } = require('../composition/listings');
            ListingSubmissionPolicy.#defaultInstance = new ListingSubmissionPolicy(
                getListingRepository()
            );
        }
        return ListingSubmissionPolicy.#defaultInstance.reserveSlot(input);
    }
}
