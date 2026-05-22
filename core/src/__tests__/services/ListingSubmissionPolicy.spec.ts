/**
 * ListingSubmissionPolicy — Unit Tests
 *
 * Strategy:
 *   ListingSubmissionPolicy.reserveSlot is a thin orchestrator with 3 decision branches:
 *     1. actor === 'admin'          → immediate bypass (no DB/queue calls)
 *     2. listingType === 'ad'       → delegates to AdSlotService.consumeSlot
 *     3. listingType === 'service'
 *        listingType === 'spare_part' → delegates to checkPostLimit (PlanService)
 *
 *   We mock both direct dependencies and assert on:
 *     - which dependency is called (or not called)
 *     - the shape of the returned reservation
 *     - error propagation when a dependency throws
 */

// ── Mocks must be hoisted before any imports ──────────────────────────────────

jest.mock('../../services/AdSlotService', () => ({
    AdSlotService: {
        consumeSlot: jest.fn(),
    },
}));

jest.mock('../../services/PlanService', () => ({
    checkPostLimit: jest.fn(),
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────────

import { ListingSubmissionPolicy, type ListingSubmissionPolicyInput } from '../../services/ListingSubmissionPolicy';
import { AdSlotService } from '../../services/AdSlotService';
import { checkPostLimit } from '../../services/PlanService';
import { LISTING_TYPE } from '@esparex/shared';

// ── Typed mock handles ────────────────────────────────────────────────────────

const mockConsumeSlot  = AdSlotService.consumeSlot as jest.Mock;
const mockCheckPostLimit = checkPostLimit as jest.Mock;

// ── Shared fixtures ───────────────────────────────────────────────────────────

const USER_ID  = 'user-abc-123';
const ADMIN_ID = 'admin-xyz-999';
const LISTING_ID = '60b9b0b9b0b9b0b9b0b9b0b9';

function makeInput(overrides: Partial<ListingSubmissionPolicyInput> = {}): ListingSubmissionPolicyInput {
    return {
        userId:      USER_ID,
        listingType: LISTING_TYPE.AD,
        actor:       'user',
        ...overrides,
    };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ListingSubmissionPolicy.reserveSlot', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // =========================================================================
    // BRANCH 1: Admin bypass
    // =========================================================================
    describe('admin actor', () => {
        it('returns admin_bypass immediately without calling any dependency', async () => {
            const result = await ListingSubmissionPolicy.reserveSlot(
                makeInput({ actor: 'admin', userId: ADMIN_ID })
            );

            expect(result).toEqual({ source: 'admin_bypass' });
            expect(mockConsumeSlot).not.toHaveBeenCalled();
            expect(mockCheckPostLimit).not.toHaveBeenCalled();
        });

        it('bypasses regardless of listingType (ad)', async () => {
            const result = await ListingSubmissionPolicy.reserveSlot(
                makeInput({ actor: 'admin', listingType: LISTING_TYPE.AD })
            );
            expect(result.source).toBe('admin_bypass');
        });

        it('bypasses regardless of listingType (service)', async () => {
            const result = await ListingSubmissionPolicy.reserveSlot(
                makeInput({ actor: 'admin', listingType: LISTING_TYPE.SERVICE })
            );
            expect(result.source).toBe('admin_bypass');
        });

        it('bypasses regardless of listingType (spare_part)', async () => {
            const result = await ListingSubmissionPolicy.reserveSlot(
                makeInput({ actor: 'admin', listingType: LISTING_TYPE.SPARE_PART })
            );
            expect(result.source).toBe('admin_bypass');
        });
    });

    // =========================================================================
    // BRANCH 2: AD listings → AdSlotService.consumeSlot
    // =========================================================================
    describe('user actor + listingType: ad', () => {
        it('delegates to AdSlotService and returns source from its result (free_slot)', async () => {
            mockConsumeSlot.mockResolvedValue({ source: 'free_slot' });

            const result = await ListingSubmissionPolicy.reserveSlot(makeInput());

            expect(mockConsumeSlot).toHaveBeenCalledTimes(1);
            expect(mockConsumeSlot).toHaveBeenCalledWith(USER_ID, undefined, undefined);
            expect(result).toEqual({ source: 'free_slot' });
        });

        it('returns ad_credit when user has no free slots but has paid credits', async () => {
            mockConsumeSlot.mockResolvedValue({ source: 'ad_credit' });

            const result = await ListingSubmissionPolicy.reserveSlot(makeInput());

            expect(result).toEqual({ source: 'ad_credit' });
        });

        it('returns idempotency_hit when the same adId was already consumed', async () => {
            mockConsumeSlot.mockResolvedValue({ source: 'idempotency_hit' });

            const result = await ListingSubmissionPolicy.reserveSlot(
                makeInput({ listingId: LISTING_ID })
            );

            expect(mockConsumeSlot).toHaveBeenCalledWith(USER_ID, undefined, LISTING_ID);
            expect(result).toEqual({ source: 'idempotency_hit' });
        });

        it('forwards the session to AdSlotService', async () => {
            mockConsumeSlot.mockResolvedValue({ source: 'free_slot' });
            const fakeSession = {} as any;

            await ListingSubmissionPolicy.reserveSlot(
                makeInput({ session: fakeSession })
            );

            expect(mockConsumeSlot).toHaveBeenCalledWith(USER_ID, fakeSession, undefined);
        });

        it('propagates QUOTA_EXCEEDED error when AdSlotService throws', async () => {
            const quotaError = Object.assign(new Error('No ad posting slots available.'), {
                statusCode: 422,
                code: 'QUOTA_EXCEEDED',
            });
            mockConsumeSlot.mockRejectedValue(quotaError);

            await expect(
                ListingSubmissionPolicy.reserveSlot(makeInput())
            ).rejects.toMatchObject({ code: 'QUOTA_EXCEEDED' });

            expect(mockCheckPostLimit).not.toHaveBeenCalled();
        });

        it('does NOT call checkPostLimit for AD listings', async () => {
            mockConsumeSlot.mockResolvedValue({ source: 'free_slot' });

            await ListingSubmissionPolicy.reserveSlot(makeInput());

            expect(mockCheckPostLimit).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // BRANCH 3: SERVICE listings → checkPostLimit('service')
    // =========================================================================
    describe('user actor + listingType: service', () => {
        it('delegates to checkPostLimit with type "service" and returns active_slot_limit', async () => {
            mockCheckPostLimit.mockResolvedValue(true);

            const result = await ListingSubmissionPolicy.reserveSlot(
                makeInput({ listingType: LISTING_TYPE.SERVICE })
            );

            expect(mockCheckPostLimit).toHaveBeenCalledTimes(1);
            expect(mockCheckPostLimit).toHaveBeenCalledWith(USER_ID, 'service', undefined);
            expect(result).toEqual({ source: 'active_slot_limit' });
        });

        it('forwards the session to checkPostLimit', async () => {
            mockCheckPostLimit.mockResolvedValue(true);
            const fakeSession = {} as any;

            await ListingSubmissionPolicy.reserveSlot(
                makeInput({ listingType: LISTING_TYPE.SERVICE, session: fakeSession })
            );

            expect(mockCheckPostLimit).toHaveBeenCalledWith(USER_ID, 'service', fakeSession);
        });

        it('propagates QUOTA_EXCEEDED when service slot limit is reached', async () => {
            const limitError = Object.assign(
                new Error('Active slot limit reached (3/3).'),
                { statusCode: 422, code: 'QUOTA_EXCEEDED' }
            );
            mockCheckPostLimit.mockRejectedValue(limitError);

            await expect(
                ListingSubmissionPolicy.reserveSlot(
                    makeInput({ listingType: LISTING_TYPE.SERVICE })
                )
            ).rejects.toMatchObject({ code: 'QUOTA_EXCEEDED' });
        });

        it('does NOT call AdSlotService.consumeSlot for service listings', async () => {
            mockCheckPostLimit.mockResolvedValue(true);

            await ListingSubmissionPolicy.reserveSlot(
                makeInput({ listingType: LISTING_TYPE.SERVICE })
            );

            expect(mockConsumeSlot).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // BRANCH 3b: SPARE_PART listings → checkPostLimit('spare_part_listing')
    // =========================================================================
    describe('user actor + listingType: spare_part', () => {
        it('delegates to checkPostLimit with type "spare_part_listing"', async () => {
            mockCheckPostLimit.mockResolvedValue(true);

            const result = await ListingSubmissionPolicy.reserveSlot(
                makeInput({ listingType: LISTING_TYPE.SPARE_PART })
            );

            expect(mockCheckPostLimit).toHaveBeenCalledWith(USER_ID, 'spare_part_listing', undefined);
            expect(result).toEqual({ source: 'active_slot_limit' });
        });

        it('propagates QUOTA_EXCEEDED when spare-part slot limit is reached', async () => {
            const limitError = Object.assign(
                new Error('Active slot limit reached (10/10).'),
                { statusCode: 422, code: 'QUOTA_EXCEEDED' }
            );
            mockCheckPostLimit.mockRejectedValue(limitError);

            await expect(
                ListingSubmissionPolicy.reserveSlot(
                    makeInput({ listingType: LISTING_TYPE.SPARE_PART })
                )
            ).rejects.toMatchObject({ code: 'QUOTA_EXCEEDED' });
        });

        it('does NOT call AdSlotService.consumeSlot for spare_part listings', async () => {
            mockCheckPostLimit.mockResolvedValue(true);

            await ListingSubmissionPolicy.reserveSlot(
                makeInput({ listingType: LISTING_TYPE.SPARE_PART })
            );

            expect(mockConsumeSlot).not.toHaveBeenCalled();
        });

        it('forwards the session to checkPostLimit', async () => {
            mockCheckPostLimit.mockResolvedValue(true);
            const fakeSession = {} as any;

            await ListingSubmissionPolicy.reserveSlot(
                makeInput({ listingType: LISTING_TYPE.SPARE_PART, session: fakeSession })
            );

            expect(mockCheckPostLimit).toHaveBeenCalledWith(USER_ID, 'spare_part_listing', fakeSession);
        });
    });
});
