/**
 * P0-6 CONTRACT — single entitlements-owned `UserWallet` write API.
 *
 * Pins the consolidation of the 5 direct `UserWallet` writers (payments, boosts,
 * notifications, identity) behind `EntitlementWalletWriter`:
 *  - the monthly reset field set is schema-derived and covers the UNION of the old
 *    bulk reset (payments `PlanService`: only `monthlyFreeAdsUsed`) and the old lazy
 *    reset (boosts `AdSlotService`: both counters) — the differing field sets were the bug;
 *  - the no-session write from notifications' `SmartAlertMutationService` is fixed:
 *    every write runs inside a transaction;
 *  - no `UserWallet` update call sites remain outside the entitlements domain
 *    (except the deprecated retired promotion flow, deletion Phase 4).
 */
import * as fs from 'fs';
import * as path from 'path';

const mockUpdateOne = jest.fn();
const mockUpdateMany = jest.fn();
const mockFindOne = jest.fn();
const mockFindOneAndUpdate = jest.fn();

jest.mock('../../../models/UserWallet', () => ({
    __esModule: true,
    default: {
        updateOne: (...args: unknown[]) => mockUpdateOne(...args),
        updateMany: (...args: unknown[]) => mockUpdateMany(...args),
        findOne: (...args: unknown[]) => mockFindOne(...args),
        findOneAndUpdate: (...args: unknown[]) => mockFindOneAndUpdate(...args),
        schema: {
            paths: {
                userId: {},
                adCredits: {},
                boostCredits: {},
                monthlyFreeAdsUsed: {},
                monthlyFreeAlertsUsed: {},
                spotlightCredits: {},
                smartAlertSlots: {},
                consumedSlots: {},
                lastMonthlyReset: {},
                createdAt: {},
                updatedAt: {},
            },
        },
    },
}));

const mockStartSession = jest.fn();
jest.mock('../../../config/db', () => ({
    getUserConnection: () => ({ startSession: (...args: unknown[]) => mockStartSession(...args) }),
}));

import {
    getMonthlyResetFields,
    getMonthlyCycleStart,
    resetMonthlyCycleForUser,
    resetMonthlyCycleBulk,
    incrementMonthlyUsage,
    adjustWalletCredits,
    bootstrapWallet,
} from '../../../domains/entitlements/application/EntitlementWalletWriter';

const USER_ID = 'user_123';

const mockSession = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    abortTransaction: jest.fn().mockResolvedValue(undefined),
    endSession: jest.fn(),
};

beforeEach(() => {
    jest.clearAllMocks();
    mockStartSession.mockResolvedValue(mockSession);
    mockFindOne.mockImplementation(() => ({
        session: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ userId: USER_ID, lastMonthlyReset: new Date('2020-01-01') }),
    }));
    mockUpdateOne.mockResolvedValue({ modifiedCount: 1 });
    mockUpdateMany.mockResolvedValue({ modifiedCount: 42 });
    mockFindOneAndUpdate.mockResolvedValue({ userId: USER_ID });
});

describe('EntitlementWalletWriter contract (P0-6)', () => {
    describe('schema-driven monthly reset field set (D-02 reconciliation)', () => {
        it('covers every monthly* schema path plus the reset marker', () => {
            // The union the two old resets disagreed on: bulk reset forgot
            // monthlyFreeAlertsUsed. The unified set is derived from the schema.
            expect([...getMonthlyResetFields()].sort()).toEqual(
                ['monthlyFreeAdsUsed', 'monthlyFreeAlertsUsed'].sort()
            );
        });

        it('bulk reset zeroes ALL monthly counters and stamps the cycle start', async () => {
            const now = new Date('2026-10-06T12:00:00Z');

            const { cycleStart, modifiedCount } = await resetMonthlyCycleBulk({ now });

            expect(mockUpdateMany).toHaveBeenCalledTimes(1);
            const [, update] = mockUpdateMany.mock.calls[0];
            // UNION field set — the old bulk reset only set monthlyFreeAdsUsed.
            expect(update.$set.monthlyFreeAdsUsed).toBe(0);
            expect(update.$set.monthlyFreeAlertsUsed).toBe(0);
            // Reconciled marker: cycle start, not the cron run time.
            expect(update.$set.lastMonthlyReset).toEqual(cycleStart);
            expect(update.$set.lastMonthlyReset).toEqual(getMonthlyCycleStart(now));
            expect(modifiedCount).toBe(42);
        });

        it('bulk reset only touches wallets whose marker predates the cycle', async () => {
            const now = new Date('2026-10-06T12:00:00Z');
            const cycleStart = getMonthlyCycleStart(now);

            await resetMonthlyCycleBulk({ now });

            const [filter] = mockUpdateMany.mock.calls[0];
            expect(filter).toEqual({
                $or: [
                    { lastMonthlyReset: { $exists: false } },
                    { lastMonthlyReset: { $lt: cycleStart } },
                ],
            });
        });

        it('lazy per-user reset uses the identical field set (no drift)', async () => {
            await resetMonthlyCycleForUser({ userId: USER_ID });

            expect(mockUpdateOne).toHaveBeenCalledTimes(1);
            const [, update] = mockUpdateOne.mock.calls[0];
            expect(update.$set.monthlyFreeAdsUsed).toBe(0);
            expect(update.$set.monthlyFreeAlertsUsed).toBe(0);
            expect(update.$set.lastMonthlyReset).toEqual(getMonthlyCycleStart());
        });

        it('lazy reset is a no-op when the marker is current', async () => {
            mockFindOne.mockImplementation(() => ({
                session: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue({
                    userId: USER_ID,
                    lastMonthlyReset: new Date(),
                }),
            }));

            await resetMonthlyCycleForUser({ userId: USER_ID });

            expect(mockUpdateOne).not.toHaveBeenCalled();
        });
    });

    describe('no-session write fix (D-03)', () => {
        it('incrementMonthlyUsage opens its own session+transaction when the caller has none', async () => {
            await incrementMonthlyUsage({ userId: USER_ID, field: 'monthlyFreeAlertsUsed', amount: 1 });

            expect(mockStartSession).toHaveBeenCalledTimes(1);
            expect(mockSession.startTransaction).toHaveBeenCalledTimes(1);
            expect(mockUpdateOne).toHaveBeenCalledWith(
                { userId: USER_ID },
                { $inc: { monthlyFreeAlertsUsed: 1 } },
                { upsert: true, session: mockSession }
            );
            expect(mockSession.commitTransaction).toHaveBeenCalledTimes(1);
        });

        it('reuses the caller session when one is provided', async () => {
            await incrementMonthlyUsage({
                userId: USER_ID,
                field: 'monthlyFreeAdsUsed',
                amount: 1,
                session: mockSession as never,
            });

            expect(mockStartSession).not.toHaveBeenCalled();
            expect(mockUpdateOne).toHaveBeenCalledWith(
                { userId: USER_ID },
                { $inc: { monthlyFreeAdsUsed: 1 } },
                { upsert: true, session: mockSession }
            );
        });
    });

    describe('single write API surface', () => {
        it('adjustWalletCredits routes $inc through a transaction', async () => {
            await adjustWalletCredits({ userId: USER_ID, delta: { adCredits: 3 } });

            expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
                { userId: USER_ID },
                { $inc: { adCredits: 3 } },
                expect.objectContaining({ new: true, upsert: false, session: mockSession })
            );
        });

        it('bootstrapWallet upserts the documented defaults idempotently', async () => {
            await bootstrapWallet({ userId: USER_ID });

            expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
                { userId: USER_ID },
                {
                    $setOnInsert: expect.objectContaining({
                        adCredits: 0,
                        boostCredits: 0,
                        monthlyFreeAdsUsed: 0,
                        spotlightCredits: 0,
                        smartAlertSlots: 2,
                    }),
                },
                expect.objectContaining({ upsert: true, new: true, setDefaultsOnInsert: true })
            );
        });
    });

    describe('single-API funnel (source scan)', () => {
        const CORE_SRC = path.resolve(__dirname, '../../..');
        const WRITE_PATTERN = /UserWallet\.(updateOne|updateMany|findOneAndUpdate|findOneAndReplace)\s*\(/;
        // Retired promotion flow — deprecated, deletion approved only in Phase 4 (§4).
        const ALLOWLIST = new Set([
            'core/src/domains/entitlements/application/EntitlementWalletWriter.ts',
            'core/src/domains/payments/application/PromotionService.ts',
        ]);

        const collectTsFiles = (dir: string): string[] => {
            const out: string[] = [];
            for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                const full = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    if (['node_modules', 'dist', 'coverage'].includes(entry.name)) continue;
                    out.push(...collectTsFiles(full));
                } else if (entry.isFile() && full.endsWith('.ts') && !full.endsWith('.spec.ts') && !full.endsWith('.test.ts')) {
                    out.push(full);
                }
            }
            return out;
        };

        it('no UserWallet update call sites exist outside entitlements (except the retired flow)', () => {
            const offenders: string[] = [];
            for (const file of collectTsFiles(CORE_SRC)) {
                const rel = path.relative(path.resolve(__dirname, '../../../../..'), file);
                if (ALLOWLIST.has(rel)) continue;
                const content = fs.readFileSync(file, 'utf8');
                if (WRITE_PATTERN.test(content)) {
                    offenders.push(rel);
                }
            }
            expect(offenders).toEqual([]);
        });
    });
});
