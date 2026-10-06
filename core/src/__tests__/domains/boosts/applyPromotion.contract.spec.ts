/**
 * P0-1 CONTRACT — unified `applyPromotion` (boosts domain).
 *
 * Pins the single-flow semantics that the merge of
 * `payments/application/PromotionService` (flow A) and
 * `listings/.../AdPromotionService.promoteAdLogic` (flow B) must satisfy:
 * eligibility (union of both flows' rules), single credit-pool debit,
 * idempotency (no double debit), and the clamped boost window.
 *
 * Written before the merge; the retired flows' semantics are captured here so the
 * consolidation cannot silently drop or change them.
 */
import { Types } from 'mongoose';

const USER_ID = new Types.ObjectId().toHexString();
const LISTING_ID = new Types.ObjectId().toHexString();

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('mongoose', () => {
    const actual = jest.requireActual('mongoose');
    return { ...actual, startSession: jest.fn() };
});

const mockSession = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    abortTransaction: jest.fn().mockResolvedValue(undefined),
    endSession: jest.fn(),
};

const mockAdFindById = jest.fn();
const mockAdCountDocuments = jest.fn();
const mockAdUpdateOne = jest.fn();
jest.mock('@esparex/core/models/Ad', () => ({
    __esModule: true,
    default: {
        findById: (...args: unknown[]) => mockAdFindById(...args),
        countDocuments: (...args: unknown[]) => mockAdCountDocuments(...args),
        updateOne: (...args: unknown[]) => mockAdUpdateOne(...args),
    },
}));

const mockBoostFindOne = jest.fn();
const mockBoostCreate = jest.fn();
const mockBoostUpdateOne = jest.fn();
jest.mock('@esparex/core/models/Boost', () => ({
    __esModule: true,
    default: {
        findOne: (...args: unknown[]) => mockBoostFindOne(...args),
        create: (...args: unknown[]) => mockBoostCreate(...args),
        updateOne: (...args: unknown[]) => mockBoostUpdateOne(...args),
    },
}));

const mockUserFindById = jest.fn();
jest.mock('@esparex/core/models/User', () => ({
    __esModule: true,
    default: {
        findById: (...args: unknown[]) => mockUserFindById(...args),
    },
}));

const mockCreditTxCreate = jest.fn();
jest.mock('@esparex/core/models/CreditTransaction', () => ({
    __esModule: true,
    default: {
        create: (...args: unknown[]) => mockCreditTxCreate(...args),
    },
}));

jest.mock('../../../composition/listings', () => ({
    getListingsCache: () => ({
        invalidateAdFeedCaches: jest.fn().mockResolvedValue(undefined),
        invalidatePublicAdCache: jest.fn().mockResolvedValue(undefined),
    }),
}));

const mockLegacyApplyBoost = jest.fn();
const mockLegacyApplySpotlight = jest.fn();
jest.mock('../../../domains/payments/application/PromotionService', () => ({
    PromotionService: {
        applyBoost: (...args: unknown[]) => mockLegacyApplyBoost(...args),
        applySpotlight: (...args: unknown[]) => mockLegacyApplySpotlight(...args),
    },
}));

const mockLegacyPromoteAdLogic = jest.fn();
jest.mock('../../../domains/listings/application/ad/ad/AdPromotionService', () => ({
    promoteAdLogic: (...args: unknown[]) => mockLegacyPromoteAdLogic(...args),
}));

// ── Imports (after mocks) ────────────────────────────────────────────────────

import mongoose from 'mongoose';
import { applyPromotion } from '../../../domains/boosts/application/services/ApplyPromotionService';
import type { PromotionCreditPort } from '../../../domains/boosts/application/ports/PromotionCreditPort';

const futureDate = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const makeAd = (overrides: Record<string, unknown> = {}) => ({
    _id: new Types.ObjectId(LISTING_ID),
    isDeleted: false,
    status: 'live',
    listingType: 'ad',
    sellerId: new Types.ObjectId(USER_ID),
    isSpotlight: false,
    isBoosted: false,
    spotlightExpiresAt: null,
    boostExpiresAt: null,
    moderationStatus: 'approved',
    expiresAt: futureDate(60),
    ...overrides,
});

const makeUser = (overrides: Record<string, unknown> = {}) => ({
    trustScore: 80,
    strikeCount: 0,
    ...overrides,
});

const makePort = (): PromotionCreditPort & { debitPromotionCredit: jest.Mock } => ({
    debitPromotionCredit: jest.fn().mockResolvedValue(undefined),
});

const mockQuery = <T>(value: T) => ({ session: jest.fn().mockResolvedValue(value) });

beforeEach(() => {
    jest.clearAllMocks();
    process.env.ENABLE_UNIFIED_APPLY_PROMOTION = 'true';

    (mongoose.startSession as jest.Mock).mockResolvedValue(mockSession);

    mockAdFindById.mockImplementation(() => ({ lean: jest.fn().mockResolvedValue(makeAd()) }));
    mockAdCountDocuments.mockResolvedValue(0);
    mockAdUpdateOne.mockResolvedValue({ modifiedCount: 1 });
    mockUserFindById.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeUser()) }),
    }));
    mockBoostFindOne.mockImplementation(() => ({
        session: jest.fn().mockResolvedValue(null),
        sort: jest.fn().mockResolvedValue(null),
    }));
    mockBoostCreate.mockImplementation(async (docs: Record<string, unknown>[]) => [
        { _id: new Types.ObjectId(), ...docs[0] },
    ]);
    mockBoostUpdateOne.mockResolvedValue({ modifiedCount: 1 });
    mockCreditTxCreate.mockResolvedValue([]);
});

const baseParams = (overrides: Record<string, unknown> = {}) => ({
    userId: USER_ID,
    listingId: LISTING_ID,
    entityType: 'ad' as const,
    promotionType: 'push_to_top' as const,
    durationDays: 30,
    creditPort: makePort(),
    ...overrides,
});

describe('applyPromotion — unified promotion contract (P0-1)', () => {
    describe('eligibility (union of both retired flows)', () => {
        it('rejects non-live listings (retired payments flow: PromotionPolicyService)', async () => {
            mockAdFindById.mockImplementation(() => ({
                lean: jest.fn().mockResolvedValue(makeAd({ status: 'draft' })),
            }));
            const port = makePort();

            await expect(applyPromotion(baseParams({ creditPort: port }))).rejects.toMatchObject({
                code: 'PROMOTION_STATUS_INVALID',
            });
            expect(port.debitPromotionCredit).not.toHaveBeenCalled();
            expect(mockBoostCreate).not.toHaveBeenCalled();
        });

        it('rejects spare parts (both retired flows)', async () => {
            mockAdFindById.mockImplementation(() => ({
                lean: jest.fn().mockResolvedValue(makeAd({ listingType: 'spare_part' })),
            }));

            await expect(applyPromotion(baseParams())).rejects.toMatchObject({
                code: 'PROMOTION_TYPE_NOT_SUPPORTED',
            });
        });

        it('rejects repurchasing an active spotlight on the same listing (tier hierarchy)', async () => {
            mockAdFindById.mockImplementation(() => ({
                lean: jest.fn().mockResolvedValue(
                    makeAd({ isSpotlight: true, spotlightExpiresAt: futureDate(10) })
                ),
            }));

            await expect(
                applyPromotion(baseParams({ promotionType: 'spotlight_hp' }))
            ).rejects.toMatchObject({ code: 'ACTIVE_SPOTLIGHT_EXISTS' });
        });

        it('rejects repurchasing an active top-ad but allows top-ad → spotlight upgrade', async () => {
            mockAdFindById.mockImplementation(() => ({
                lean: jest.fn().mockResolvedValue(
                    makeAd({ isBoosted: true, boostExpiresAt: futureDate(10) })
                ),
            }));
            const port = makePort();

            await expect(applyPromotion(baseParams({ creditPort: port }))).rejects.toMatchObject({
                code: 'ACTIVE_TOP_AD_EXISTS',
            });
            expect(port.debitPromotionCredit).not.toHaveBeenCalled();

            // upgrade path is allowed
            const result = await applyPromotion(
                baseParams({ promotionType: 'spotlight_hp', creditPort: port })
            );
            expect(result.boost).toBeDefined();
            expect(port.debitPromotionCredit).toHaveBeenCalledTimes(1);
        });

        it('rejects when the caller does not own the listing (retired listings flow)', async () => {
            mockAdFindById.mockImplementation(() => ({
                lean: jest.fn().mockResolvedValue(
                    makeAd({ sellerId: new Types.ObjectId() })
                ),
            }));

            await expect(applyPromotion(baseParams())).rejects.toMatchObject({ statusCode: 403 });
        });

        it('rejects low trust score / strikes (retired listings flow)', async () => {
            mockUserFindById.mockImplementation(() => ({
                select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeUser({ trustScore: 10 })) }),
            }));
            await expect(applyPromotion(baseParams())).rejects.toThrow(
                'Account ineligible for promotion'
            );

            mockUserFindById.mockImplementation(() => ({
                select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeUser({ strikeCount: 3 })) }),
            }));
            await expect(applyPromotion(baseParams())).rejects.toThrow(
                'Account ineligible for promotion'
            );
        });

        it('rejects ads not in normal moderation standing (retired listings flow)', async () => {
            mockAdFindById.mockImplementation(() => ({
                lean: jest.fn().mockResolvedValue(makeAd({ moderationStatus: 'held_for_review' })),
            }));

            await expect(applyPromotion(baseParams())).rejects.toThrow(
                'Ad must be in normal standing'
            );
        });

        it('enforces the 3-concurrent-spotlight cap (retired listings flow)', async () => {
            mockAdCountDocuments.mockResolvedValue(3);

            await expect(
                applyPromotion(baseParams({ promotionType: 'spotlight_hp' }))
            ).rejects.toThrow('Maximum 3 active spotlight promotions');
        });

        it('rejects expired listings (retired payments flow)', async () => {
            mockAdFindById.mockImplementation(() => ({
                lean: jest.fn().mockResolvedValue(
                    makeAd({ status: 'expired', expiresAt: new Date(Date.now() - 1000) })
                ),
            }));

            await expect(applyPromotion(baseParams())).rejects.toMatchObject({ code: 'AD_EXPIRED' });
        });
    });

    describe('credit-pool debit (exactly one debit per promotion)', () => {
        it('debits 1 boostCredits via the port for push_to_top, inside the session', async () => {
            const port = makePort();

            await applyPromotion(baseParams({ creditPort: port }));

            expect(port.debitPromotionCredit).toHaveBeenCalledTimes(1);
            expect(port.debitPromotionCredit).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: USER_ID,
                    creditType: 'boostCredits',
                    amount: 1,
                    session: mockSession,
                })
            );
        });

        it('debits 1 spotlightCredits via the port for spotlight_hp', async () => {
            const port = makePort();

            await applyPromotion(baseParams({ promotionType: 'spotlight_hp', creditPort: port }));

            expect(port.debitPromotionCredit).toHaveBeenCalledWith(
                expect.objectContaining({ creditType: 'spotlightCredits', amount: 1 })
            );
        });

        it('writes the promotion audit record and syncs the ad document', async () => {
            const port = makePort();

            const { boost, effectiveDays } = await applyPromotion(baseParams({ creditPort: port }));

            expect(mockBoostCreate).toHaveBeenCalledTimes(1);
            const [docs, opts] = mockBoostCreate.mock.calls[0];
            expect(docs[0]).toMatchObject({ boostType: 'push_to_top', isActive: true });
            expect(opts).toMatchObject({ session: mockSession });
            expect(mockAdUpdateOne).toHaveBeenCalledWith(
                expect.anything(),
                { $set: expect.objectContaining({ isBoosted: true }) },
                { session: mockSession }
            );
            expect(mockCreditTxCreate).toHaveBeenCalledTimes(1);
            expect(effectiveDays).toBeGreaterThanOrEqual(1);
            expect(boost.endsAt).toBeInstanceOf(Date);
        });
    });

    describe('idempotency (no double debit)', () => {
        it('rejects a sequential re-apply while an identical active boost exists', async () => {
            const existing = {
                _id: new Types.ObjectId(),
                boostType: 'push_to_top',
                endsAt: futureDate(10),
            };
            mockBoostFindOne.mockImplementation(() => ({
                session: jest.fn().mockResolvedValue(existing),
                sort: jest.fn().mockResolvedValue(existing),
            }));
            const port = makePort();

            await expect(applyPromotion(baseParams({ creditPort: port }))).rejects.toMatchObject({
                code: 'ACTIVE_PROMOTION_EXISTS',
            });
            expect(port.debitPromotionCredit).not.toHaveBeenCalled();
            expect(mockBoostCreate).not.toHaveBeenCalled();
            expect(mockSession.abortTransaction).toHaveBeenCalled();
        });
    });

    describe('boost window (clamp survives; reject loses)', () => {
        it('clamps endsAt to the ad expiry instead of rejecting', async () => {
            const expiresAt = futureDate(5);
            mockAdFindById.mockImplementation(() => ({
                lean: jest.fn().mockResolvedValue(makeAd({ expiresAt })),
            }));
            const port = makePort();

            const { boost, effectiveDays } = await applyPromotion(
                baseParams({ durationDays: 30, creditPort: port })
            );

            // clamped, not rejected — the retired listings flow threw here
            expect(new Date(boost.endsAt).getTime()).toBeLessThanOrEqual(expiresAt.getTime());
            expect(effectiveDays).toBeLessThanOrEqual(5);
            expect(port.debitPromotionCredit).toHaveBeenCalledTimes(1);
        });
    });

    describe('admin channel (retired listings flow bypass)', () => {
        it('skips eligibility and debit for admins, and extends an active spotlight', async () => {
            const existing = {
                _id: new Types.ObjectId(),
                boostType: 'spotlight_hp',
                endsAt: futureDate(3),
            };
            mockBoostFindOne.mockImplementation(() => ({
                session: jest.fn().mockResolvedValue(existing),
                sort: jest.fn().mockResolvedValue(existing),
            }));
            // ad would fail every non-admin check: wrong owner, low trust, bad standing
            mockAdFindById.mockImplementation(() => ({
                lean: jest.fn().mockResolvedValue(
                    makeAd({
                        sellerId: new Types.ObjectId(),
                        moderationStatus: 'held_for_review',
                        isSpotlight: true,
                        spotlightExpiresAt: futureDate(3),
                    })
                ),
            }));
            mockUserFindById.mockImplementation(() => ({
                select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(makeUser({ trustScore: 0 })) }),
            }));
            const port = makePort();

            const { boost } = await applyPromotion(
                baseParams({ promotionType: 'spotlight_hp', isAdmin: true, durationDays: 7, creditPort: port })
            );

            expect(port.debitPromotionCredit).not.toHaveBeenCalled();
            expect(mockBoostUpdateOne).toHaveBeenCalledWith(
                { _id: existing._id },
                { $set: { endsAt: expect.any(Date) } },
                { session: mockSession }
            );
            expect(boost._id).toEqual(existing._id);
        });
    });

    describe('feature flag rollback (ENABLE_UNIFIED_APPLY_PROMOTION=OFF)', () => {
        beforeEach(() => {
            process.env.ENABLE_UNIFIED_APPLY_PROMOTION = 'false';
            mockBoostFindOne.mockImplementation(() => ({
                session: jest.fn().mockResolvedValue(null),
                sort: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), boostType: 'push_to_top', endsAt: futureDate(30) }),
            }));
        });

        it('routes the controller source to the retired payments flow', async () => {
            mockLegacyApplyBoost.mockResolvedValue({ _id: new Types.ObjectId() });

            await applyPromotion(baseParams({ legacySource: 'listing-controller' }));

            expect(mockLegacyApplyBoost).toHaveBeenCalledWith(
                expect.objectContaining({ userId: USER_ID, listingId: LISTING_ID, durationDays: 30 })
            );
            expect(mockLegacyPromoteAdLogic).not.toHaveBeenCalled();
        });

        it('routes the ad-mutation source to the retired listings flow', async () => {
            mockLegacyPromoteAdLogic.mockResolvedValue({ _id: new Types.ObjectId(LISTING_ID) });

            await applyPromotion(
                baseParams({
                    promotionType: 'spotlight_hp',
                    legacySource: 'ad-mutation',
                    durationDays: 7,
                })
            );

            expect(mockLegacyPromoteAdLogic).toHaveBeenCalledWith(
                expect.objectContaining({ id: LISTING_ID, userId: USER_ID, days: 7, type: 'spotlight_hp' })
            );
            expect(mockLegacyApplyBoost).not.toHaveBeenCalled();
            expect(mockLegacyApplySpotlight).not.toHaveBeenCalled();
        });
    });
});
