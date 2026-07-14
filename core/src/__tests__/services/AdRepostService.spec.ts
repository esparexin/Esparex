/**
 * AdRepostService — Unit Tests
 * 
 * Strategy:
 *   AdRepostService handles the delicate transition of expired or rejected 
 *   listings back into the moderation funnel. It ensures that quotas are 
 *   properly deducted and that the listing state is reset for a fresh review.
 */

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@esparex/core/composition/listings', () => ({
    getListingRepository: jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue({
            id: 'ad_1',
            status: 'expired',
            listingType: 'ad',
            userId: 'user_1',
            categoryId: 'cat_1'
        }),
        updateOne: jest.fn().mockResolvedValue({
            id: 'ad_1',
            status: 'active',
            listingType: 'ad'
        }),
        updateOneByFilter: jest.fn().mockResolvedValue({
            id: 'ad_1',
            status: 'active',
            listingType: 'ad'
        }),
        find: jest.fn().mockResolvedValue([]),
        insert: jest.fn(),
        updateMany: jest.fn()
    }),
    getListingUnitOfWork: jest.fn().mockReturnValue({
        executeTransaction: jest.fn().mockImplementation((work) => work('mock-session'))
    })
}));

jest.mock('@esparex/core/models/Ad', () => ({
    __esModule: true,
    default: {
        findById: jest.fn(),
    },
}));

jest.mock('../../config/db');
jest.mock('@esparex/core/config/db');

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

import { getListingRepository } from '@esparex/core/composition/listings';

// ── Typed Mocks ──────────────────────────────────────────────────────────────

const mockRepo = getListingRepository() as jest.Mocked<ReturnType<typeof getListingRepository>>;
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
        mockRepo.findOne.mockResolvedValue(ad as any);
        mockMutateStatus.mockResolvedValue({ ...ad, status: LISTING_STATUS.PENDING });

        const result = await repostAdLogic(AD_ID, USER_ID);

        expect(result).toBeDefined();
        expect(mockReserveSlot).toHaveBeenCalledWith(expect.objectContaining({
            userId: USER_ID,
            listingId: AD_ID,
            listingType: 'ad'
        }));
        expect(mockRepo.updateOne).toHaveBeenCalled();
        expect(mockMutateStatus).toHaveBeenCalledWith(expect.objectContaining({
            toStatus: LISTING_STATUS.PENDING,
            reason: 'Reposted by seller'
        }));
    });

    it('should successfully repost a rejected ad', async () => {
        const ad = makeAd({ status: LISTING_STATUS.REJECTED });
        mockRepo.findOne.mockResolvedValue(ad as any);
        mockMutateStatus.mockResolvedValue({ ...ad, status: LISTING_STATUS.PENDING });

        await repostAdLogic(AD_ID, USER_ID);

        expect(ad.status).toBe(LISTING_STATUS.REJECTED); // Original before mutation
        expect(mockMutateStatus).toHaveBeenCalled();
    });

    it('should throw error if ad is currently live', async () => {
        const ad = makeAd({ status: LISTING_STATUS.LIVE });
        mockRepo.findOne.mockResolvedValue(ad as any);

        await expect(repostAdLogic(AD_ID, USER_ID))
            .rejects.toThrow('Only expired or rejected ads can be reposted');
    });

    it('should throw error if ad is not found', async () => {
        mockRepo.findOne.mockResolvedValue(null);

        await expect(repostAdLogic(AD_ID, USER_ID))
            .rejects.toThrow('Ad not found');
    });

    it('should throw error if quota reservation fails', async () => {
        const ad = makeAd();
        mockRepo.findOne.mockResolvedValue(ad as any);
        mockReserveSlot.mockRejectedValue(new Error('QUOTA_EXCEEDED'));

        await expect(repostAdLogic(AD_ID, USER_ID))
            .rejects.toThrow('QUOTA_EXCEEDED');
    });

    it('should propagate status mutation errors', async () => {
        const ad = makeAd();
        mockRepo.findOne.mockResolvedValue(ad as any);
        mockMutateStatus.mockRejectedValue(new Error('MUTATION_FAILED'));

        await expect(repostAdLogic(AD_ID, USER_ID))
            .rejects.toThrow('MUTATION_FAILED');
    });

    it('should reset moderation status and reason during repost', async () => {
        const ad = makeAd();
        mockRepo.findOne.mockResolvedValue(ad as any);
        mockMutateStatus.mockResolvedValue(ad);

        await repostAdLogic(AD_ID, USER_ID);

        expect(mockRepo.updateOne).toHaveBeenCalledWith(AD_ID, expect.objectContaining({
            $set: expect.objectContaining({
                moderationStatus: 'held_for_review',
                moderationReason: 'Reposted by seller for moderation review'
            })
        }), expect.anything());
    });

    it('should reset duplicate flags and scores', async () => {
        const ad = makeAd({
            duplicateScore: 0.95,
            isDuplicateFlag: true,
            duplicateOf: 'other-id'
        });
        mockRepo.findOne.mockResolvedValue(ad as any);
        mockMutateStatus.mockResolvedValue(ad);

        await repostAdLogic(AD_ID, USER_ID);

        expect(mockRepo.updateOne).toHaveBeenCalledWith(AD_ID, expect.objectContaining({
            $set: expect.objectContaining({
                duplicateScore: 0,
                isDuplicateFlag: false
            }),
            $unset: expect.objectContaining({
                duplicateOf: 1
            })
        }), expect.anything());
    });
});
