/**
 * PlanService.checkPostLimit — unit tests
 *
 * Verifies that:
 *  - spare_part_listing uses maxParts (not maxServices)
 *  - service uses maxServices
 *  - limits are enforced correctly when quota is exceeded
 */

jest.mock('../../services/AdSlotService', () => ({
    withUserPostingLock: jest.fn((_id: string, _ttl: number, fn: () => Promise<unknown>) => fn()),
    getAdPostingBalance: jest.fn(),
    AdSlotService: { consumeSlot: jest.fn() },
    getMonthlyCycleStart: jest.fn(),
}));

jest.mock('../../models/UserPlan', () => ({
    __esModule: true,
    default: {
        find: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
                session: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([]),
            }),
            lean: jest.fn().mockResolvedValue([]),
        }),
    },
}));

jest.mock('../../models/Ad', () => ({
    __esModule: true,
    default: {
        countDocuments: jest.fn().mockReturnValue({
            session: jest.fn().mockReturnThis(),
        }),
    },
}));

jest.mock('../../models/UserWallet', () => ({
    __esModule: true,
    default: { updateMany: jest.fn() },
}));

jest.mock('../../services/PlanEngine', () => ({
    calculateUserPlan: jest.fn(),
}));

import Ad from '../../models/Ad';
import { calculateUserPlan } from '../../services/PlanEngine';
import { checkPostLimit } from '../../services/PlanService';

const mockedAd = Ad as unknown as { countDocuments: jest.Mock };
const mockedCalculateUserPlan = calculateUserPlan as jest.Mock;

const makeCountMock = (count: number) => {
    const chainable: any = { then: undefined, session: jest.fn().mockReturnThis() };
    chainable.then = (resolve: (v: number) => void) => Promise.resolve(count).then(resolve);
    Object.defineProperty(chainable, Symbol.toStringTag, { value: 'Promise' });
    // Make it thenable so await works
    chainable[Symbol.for('nodejs.rejection')] = undefined;
    return chainable;
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('PlanService.checkPostLimit', () => {
    describe('spare_part_listing quota', () => {
        it('uses maxParts limit (not maxServices)', async () => {
            // Plan: 5 maxParts, 50 maxServices
            mockedCalculateUserPlan.mockReturnValue({ maxParts: 5, maxServices: 50, maxAds: 10 });
            // Current count: 4 spare parts active
            mockedAd.countDocuments.mockReturnValue({
                session: jest.fn().mockReturnThis(),
                then: (fn: (n: number) => void) => Promise.resolve(4).then(fn),
            });

            const result = await checkPostLimit('user123', 'spare_part_listing');
            expect(result).toBe(true);

            // Verify it queried with SPARE_PART listingType
            expect(mockedAd.countDocuments).toHaveBeenCalledWith(
                expect.objectContaining({ listingType: 'spare_part' })
            );
        });

        it('throws QUOTA_EXCEEDED when spare part count meets maxParts limit', async () => {
            mockedCalculateUserPlan.mockReturnValue({ maxParts: 3, maxServices: 50, maxAds: 10 });
            mockedAd.countDocuments.mockReturnValue({
                session: jest.fn().mockReturnThis(),
                then: (fn: (n: number) => void) => Promise.resolve(3).then(fn),
            });

            await expect(checkPostLimit('user123', 'spare_part_listing')).rejects.toMatchObject({
                code: 'QUOTA_EXCEEDED',
            });
        });

        it('does NOT apply maxServices limit to spare parts — would wrongly pass if maxServices pool used', async () => {
            // maxParts: 2, maxServices: 100 (if bug used maxServices, this would pass)
            mockedCalculateUserPlan.mockReturnValue({ maxParts: 2, maxServices: 100, maxAds: 10 });
            // 2 active spare parts — at limit for maxParts
            mockedAd.countDocuments.mockReturnValue({
                session: jest.fn().mockReturnThis(),
                then: (fn: (n: number) => void) => Promise.resolve(2).then(fn),
            });

            // Should throw because maxParts is 2 and count is 2
            await expect(checkPostLimit('user123', 'spare_part_listing')).rejects.toMatchObject({
                code: 'QUOTA_EXCEEDED',
            });
        });
    });

    describe('service quota', () => {
        it('uses maxServices limit', async () => {
            mockedCalculateUserPlan.mockReturnValue({ maxParts: 5, maxServices: 10, maxAds: 10 });
            mockedAd.countDocuments.mockReturnValue({
                session: jest.fn().mockReturnThis(),
                then: (fn: (n: number) => void) => Promise.resolve(9).then(fn),
            });

            const result = await checkPostLimit('user123', 'service');
            expect(result).toBe(true);

            expect(mockedAd.countDocuments).toHaveBeenCalledWith(
                expect.objectContaining({ listingType: 'service' })
            );
        });

        it('throws QUOTA_EXCEEDED when service count meets maxServices limit', async () => {
            mockedCalculateUserPlan.mockReturnValue({ maxParts: 100, maxServices: 5, maxAds: 10 });
            mockedAd.countDocuments.mockReturnValue({
                session: jest.fn().mockReturnThis(),
                then: (fn: (n: number) => void) => Promise.resolve(5).then(fn),
            });

            await expect(checkPostLimit('user123', 'service')).rejects.toMatchObject({
                code: 'QUOTA_EXCEEDED',
            });
        });
    });
});
