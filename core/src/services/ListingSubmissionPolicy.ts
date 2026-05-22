import type { ClientSession } from 'mongoose';
import { AdSlotService, type AdPostingSlotSource } from './AdSlotService';
import { LISTING_TYPE, type ListingTypeValue } from '@esparex/shared';
import { checkPostLimit } from './PlanService';

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
 */
export class ListingSubmissionPolicy {
    static async reserveSlot(input: ListingSubmissionPolicyInput): Promise<ListingSubmissionReservation> {
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
        } else {
            // For Services and Spare Parts, we enforce active inventory limits
            // defined in the user's plan.
            const type = input.listingType === LISTING_TYPE.SERVICE 
                ? 'service' 
                : 'spare_part_listing';
            
            await checkPostLimit(input.userId, type, input.session);
            
            return { source: 'active_slot_limit' };
        }
    }
}
