import { Request, Response } from 'express';
import { getCreditWalletSummary } from '../../controllers/payment/creditController';
import { getAdPostingBalance } from '@esparex/core/domains/boosts/application/services/AdSlotService';
import { DashboardFacade } from '@esparex/core/domains/payments/application/DashboardFacade';

jest.mock('@esparex/core/domains/credits/application/CreditRulesEngine');
jest.mock('@esparex/core/domains/boosts/application/services/AdSlotService');
jest.mock('@esparex/core/domains/payments/application/DashboardFacade');
jest.mock('../../utils/errorResponse', () => ({
    sendErrorResponse: jest.fn((req, res, code, msg) => res.status(code).json({ success: false, error: msg })),
}));

const mockGetAdPostingBalance = getAdPostingBalance as jest.Mock;
const mockGetDashboardSnapshot = DashboardFacade.getDashboardSnapshot as jest.Mock;

describe('creditController - getCreditWalletSummary', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            user: { _id: { toString: () => 'user_456' } } as any,
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    it('returns 401 when user is missing or unauthorized', async () => {
        req.user = undefined;
        await getCreditWalletSummary(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns aggregated balances including spotlightCredits and smartAlertSlots from DashboardFacade', async () => {
        mockGetAdPostingBalance.mockResolvedValue({
            freeLimit: 5,
            freeUsed: 2,
            freeRemaining: 3,
            paidCredits: 10,
            totalRemaining: 13,
        });

        mockGetDashboardSnapshot.mockResolvedValue({
            subscription: { planName: 'Pro Tier' },
            wallet: {
                spotlightCredits: 4,
                smartAlertSlots: 6,
            },
        });

        await getCreditWalletSummary(req as Request, res as Response);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    totalRemaining: 13,
                    adCredits: 13,
                    spotlightCredits: 4,
                    smartAlertSlots: 6,
                    subscription: expect.objectContaining({
                        activePlan: 'Pro Tier',
                    }),
                    monthlyFree: expect.objectContaining({
                        limit: 5,
                        used: 2,
                        remaining: 3,
                    }),
                    purchased: {
                        balance: 10,
                    },
                }),
            })
        );
    });

    it('gracefully provides fallbacks when DashboardFacade throws or is unavailable', async () => {
        mockGetAdPostingBalance.mockResolvedValue({
            freeLimit: 2,
            freeUsed: 0,
            freeRemaining: 2,
            paidCredits: 0,
            totalRemaining: 2,
        });

        mockGetDashboardSnapshot.mockRejectedValue(new Error('Redis/DB failure'));

        await getCreditWalletSummary(req as Request, res as Response);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    totalRemaining: 2,
                    adCredits: 2,
                    spotlightCredits: 0,
                    smartAlertSlots: 2,
                }),
            })
        );
    });
});
