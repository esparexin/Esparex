import type { ClientSession } from 'mongoose';
import { AdSlotService, type AdPostingSlotSource } from './AdSlotService';

export type SubmissionListingType = 'ad' | 'service' | 'spare_part';

export type ListingSubmissionReservation = {
    source: AdPostingSlotSource | 'admin_bypass';
};

export type ListingSubmissionPolicyInput = {
    userId: string;
    listingType: SubmissionListingType;
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

        const result = await AdSlotService.consumeSlot(
            input.userId,
            input.session,
            input.listingId
        );

        return { source: result.source };
    }
}
