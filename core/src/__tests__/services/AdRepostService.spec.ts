/**
 * AdRepostService — Unit Tests
 * 
 * Strategy:
 *   AdRepostService handles the delicate transition of expired or rejected 
 *   listings back into the moderation funnel. It ensures that quotas are 
 *   properly deducted and that the listing state is reset for a fresh review.
 */

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../models/Ad', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
    },
}));

jest.mock('../../config/db', () => ({
    getUserConnection: jest.fn().mockReturnValue({
        startSession: jest.fn().mockResolvedValue({
            withTransaction: jest.fn().mockImplementation((cb) => cb()),
            endSession: jest.fn(),
        }),
    }),
}));

jest.mock('../../services/ListingSubmissionPolicy', () => ({
    ListingSubmissionPolicy: {
        reserveSlot: jest.fn().mockResolvedValue({ success: true }),
    },
}));

jest.mock('../../services/lifecycle/StatusMutationService', () => ({
    mutateStatus: jest.fn(),
}));

jest.mock('../../services/lifecycle/AdStatusService', () => ({
    normalizeAdStatus: jest.fn((status) => status),
}));

jest.mock('../../utils/redisCache', () => ({
    invalidateAdFeedCaches: jest.fn().mockResolvedValue(undefined),
    invalidatePublicAdCache: jest.fn().mockResolvedValue(undefined),
}));

// ── Imports ──────────────────────────────────────────────────────────────────

import mongoose from 'mongoose';
import { repostAdLogic } from '../../services/ad/AdRepostService';
import Ad from '../../models/Ad';
import { ListingSubmissionPolicy } from '../../services/ListingSubmissionPolicy';
import * as StatusMutationService from '../../services/lifecycle/StatusMutationService';
import { LISTING_STATUS } from '@esparex/shared';

// ── Typed Mocks ──────────────────────────────────────────────────────────────

const mockAdModel = Ad as unknown as { findOne: jest.Mock };
const mockReserveSlot = ListingSubmissionPolicy.reserveSlot as jest.Mock;
const mockMutateStatus = StatusMutationService.mutateStatus as jest.Mock;

// ── Shared Fixtures ──────────────────────────────────────────────────────────

const AD_ID = '60b9b0b9b0b9b0b9b0b9b0b1';
const USER_ID = '60b9b0b9b0b9b0b9b0b9b0b2';

const makeAd = (overrides = {}) => ({
    _id: new mongoose.Types.ObjectId(AD_ID),
    sellerId: new mongoose.Types.ObjectId(USER_ID),
    status: LISTING_STATUS.EXPIRED,
    listingType: 'ad',
    moderationStatus: 'auto_approved',
    moderationReason: '',
    duplicateScore: 0,
    isDuplicateFlag: false,
    duplicateOf: undefined,
    save: jest.fn().mockResolvedValue(true),
    ...overrides
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('AdRepostService.repostAdLogic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockReserveSlot.mockResolvedValue({ success: true });
        mockMutateStatus.mockResolvedValue({ success: true });
    });

    it('should successfully repost an expired ad', async () => {
        const ad = makeAd();
        mockAdModel.findOne.mockReturnValue({
            session: jest.fn().mockResolvedValue(ad)
        });
        mockMutateStatus.mockResolvedValue({ ...ad, status: LISTING_STATUS.PENDING });

        const result = await repostAdLogic(AD_ID, USER_ID);

        expect(result).toBeDefined();
        expect(mockReserveSlot).toHaveBeenCalledWith(expect.objectContaining({
            userId: USER_ID,
            listingId: AD_ID,
            listingType: 'ad'
        }));
        expect(ad.save).toHaveBeenCalled();
        expect(mockMutateStatus).toHaveBeenCalledWith(expect.objectContaining({
            toStatus: LISTING_STATUS.PENDING,
            reason: 'Reposted by seller'
        }));
    });

    it('should successfully repost a rejected ad', async () => {
        const ad = makeAd({ status: LISTING_STATUS.REJECTED });
        mockAdModel.findOne.mockReturnValue({
            session: jest.fn().mockResolvedValue(ad)
        });
        mockMutateStatus.mockResolvedValue({ ...ad, status: LISTING_STATUS.PENDING });

        await repostAdLogic(AD_ID, USER_ID);

        expect(ad.status).toBe(LISTING_STATUS.REJECTED); // Original before mutation
        expect(mockMutateStatus).toHaveBeenCalled();
    });

    it('should throw error if ad is currently live', async () => {
        const ad = makeAd({ status: LISTING_STATUS.LIVE });
        mockAdModel.findOne.mockReturnValue({
            session: jest.fn().mockResolvedValue(ad)
        });

        await expect(repostAdLogic(AD_ID, USER_ID))
            .rejects.toThrow('Only expired or rejected ads can be reposted');
    });

    it('should throw error if ad is not found', async () => {
        mockAdModel.findOne.mockReturnValue({
            session: jest.fn().mockResolvedValue(null)
        });

        await expect(repostAdLogic(AD_ID, USER_ID))
            .rejects.toThrow('Ad not found');
    });

    it('should throw error if quota reservation fails', async () => {
        const ad = makeAd();
        mockAdModel.findOne.mockReturnValue({
            session: jest.fn().mockResolvedValue(ad)
        });
        mockReserveSlot.mockRejectedValue(new Error('QUOTA_EXCEEDED'));

        await expect(repostAdLogic(AD_ID, USER_ID))
            .rejects.toThrow('QUOTA_EXCEEDED');
    });

    it('should propagate status mutation errors', async () => {
        const ad = makeAd();
        mockAdModel.findOne.mockReturnValue({
            session: jest.fn().mockResolvedValue(ad)
        });
        mockMutateStatus.mockRejectedValue(new Error('MUTATION_FAILED'));

        await expect(repostAdLogic(AD_ID, USER_ID))
            .rejects.toThrow('MUTATION_FAILED');
    });

    it('should reset moderation status and reason during repost', async () => {
        const ad = makeAd();
        mockAdModel.findOne.mockReturnValue({
            session: jest.fn().mockResolvedValue(ad)
        });
        mockMutateStatus.mockResolvedValue(ad);

        await repostAdLogic(AD_ID, USER_ID);

        expect(ad.moderationStatus).toBe('held_for_review');
        expect(ad.moderationReason).toBe('Reposted by seller for moderation review');
    });

    it('should reset duplicate flags and scores', async () => {
        const ad = makeAd({
            duplicateScore: 0.95,
            isDuplicateFlag: true,
            duplicateOf: 'other-id'
        });
        mockAdModel.findOne.mockReturnValue({
            session: jest.fn().mockResolvedValue(ad)
        });
        mockMutateStatus.mockResolvedValue(ad);

        await repostAdLogic(AD_ID, USER_ID);

        expect(ad.duplicateScore).toBe(0);
        expect(ad.isDuplicateFlag).toBe(false);
        expect(ad.duplicateOf).toBeUndefined();
    });
});
