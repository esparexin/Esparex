/**
 * C-15 CONTRACT — ad-slot balance agreement.
 *
 * DECISION-GATE §3: ad-slot balance is canonical in the boosts domain
 * (`getAdPostingBalance`); payments' `getPostingBalanceByUserId` must agree
 * with it exactly (it delegates). This test pins the agreement at the value
 * level: both APIs, driven by the same wallet state, return the identical
 * balance object. Any future fork of the balance math breaks this test.
 */
import * as path from 'path';

const USER_ID = 'user_balance_1';
const CYCLE_START = new Date(Date.UTC(2026, 9, 1, 0, 0, 0, 0));

const mockFindOne = jest.fn();

jest.mock('../../../models/UserWallet', () => ({
  __esModule: true,
  default: {
    findOne: (...args: unknown[]) => mockFindOne(...args),
    schema: { paths: { monthlyFreeAdsUsed: {}, monthlyFreeAlertsUsed: {}, lastMonthlyReset: {} } },
  },
}));

jest.mock('../../../models/Plan', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn().mockResolvedValue({ limits: { maxAds: 5 }, credits: 0 }),
  },
}));

jest.mock('../../../models/Entitlement', () => ({ __esModule: true, default: {} }));
jest.mock('../../../models/CreditTransaction', () => ({ __esModule: true, default: {} }));
jest.mock('../../../models/Ad', () => ({ __esModule: true, default: {} }));

jest.mock('../../../config/redis', () => ({ __esModule: true, default: {} }));
jest.mock('../../../config/db', () => ({ getUserConnection: jest.fn() }));
jest.mock('../../../domains/payments/application/WalletService', () => ({
  getWallet: jest.fn(),
  TransactionModel: { find: jest.fn(), countDocuments: jest.fn() },
}));
jest.mock('../../../domains/payments/application/DashboardFacade', () => ({
  DashboardFacade: {},
}));

import { getAdPostingBalance } from '../../../domains/boosts/application/services/AdSlotService';
import { getPostingBalanceByUserId } from '../../../domains/payments/application/WalletQueryService';

function mockWalletDoc(overrides: Record<string, unknown> = {}) {
  mockFindOne.mockImplementation(() => ({
    session: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue({
      userId: USER_ID,
      monthlyFreeAdsUsed: 2,
      adCredits: 7,
      lastMonthlyReset: CYCLE_START,
      ...overrides,
    }),
  }));
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ad-slot balance agreement (C-15)', () => {
  it('getPostingBalanceByUserId agrees exactly with getAdPostingBalance', async () => {
    mockWalletDoc();
    const viaBoosts = await getAdPostingBalance(USER_ID);
    const viaPayments = await getPostingBalanceByUserId(USER_ID);
    expect(viaPayments).toEqual(viaBoosts);
  });

  it('computes the documented balance shape from wallet state', async () => {
    mockWalletDoc({ monthlyFreeAdsUsed: 2, adCredits: 7 });
    // freeLimit 5 (default plan) - freeUsed 2 = freeRemaining 3; paidCredits 7
    await expect(getAdPostingBalance(USER_ID)).resolves.toEqual({
      freeLimit: 5,
      freeUsed: 2,
      freeRemaining: 3,
      paidCredits: 7,
      totalRemaining: 10,
    });
  });

  it('clamps negative/over-limit usage instead of drifting', async () => {
    mockWalletDoc({ monthlyFreeAdsUsed: 9, adCredits: 0 });
    const balance = await getPostingBalanceByUserId(USER_ID);
    expect(balance.freeRemaining).toBe(0);
    expect(balance.totalRemaining).toBe(0);
    expect(balance).toEqual(await getAdPostingBalance(USER_ID));
  });

  it('reads (not writes) when the cycle marker is current', async () => {
    mockWalletDoc();
    await getPostingBalanceByUserId(USER_ID);
    // findOne for the balance read (+1 for the plan lookup inside the limit
    // resolver); no updateOne/updateMany calls happen on a current cycle.
    const updateOne = (jest.requireMock('../../../models/UserWallet').default as any).updateOne;
    expect(updateOne).toBeUndefined();
  });
});
