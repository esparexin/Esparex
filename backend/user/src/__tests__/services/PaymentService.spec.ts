import { checkTransactionVelocity, findPendingTransaction, createPaymentTransaction, getUserForPayment, getPlanById } from '@esparex/core/services';;

/**
 * Payment Mutation Controller — Unit Tests
 * 
 * Strategy:
 *   Test the entry point for payment initiation. Validates plan existence, 
 *   velocity limits (security), and correct integration with Razorpay SDK 
 *   or mock gateway.
 */

import { createPaymentOrder } from '../../controllers/payment/paymentMutationController';
import { Request, Response } from 'express';

import { getRazorpayClient, getRazorpayRuntimeConfig } from '@esparex/core/infrastructure';;;;

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@esparex/core/services/TransactionService');
jest.mock('@esparex/core/services/PlanService');
jest.mock('@esparex/core/config/razorpay');
jest.mock('@esparex/core/utils/logger');
jest.mock('@esparex/core/utils/errorResponse', () => ({
    sendErrorResponse: jest.fn((req, res, code, msg) => res.status(code).json({ success: false, error: msg }))
}));

const mockCheckTransactionVelocity = checkTransactionVelocity as jest.Mock;
const mockFindPendingTransaction = findPendingTransaction as jest.Mock;
const mockCreatePaymentTransaction = createPaymentTransaction as jest.Mock;
const mockGetUserForPayment = getUserForPayment as jest.Mock;
const mockGetPlanById = getPlanById as jest.Mock;
const mockGetRazorpayClient = getRazorpayClient as jest.Mock;
const mockGetRazorpayRuntimeConfig = getRazorpayRuntimeConfig as jest.Mock;

describe('PaymentMutationController — createPaymentOrder', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            user: { _id: 'user_123' } as any,
            body: { planId: 'plan_123' },
            headers: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        mockGetRazorpayRuntimeConfig.mockResolvedValue({ enabled: true, keyId: 'rzp_live_123' });
    });

    it('should successfully create a new Razorpay order', async () => {
        mockGetUserForPayment.mockResolvedValue({ _id: 'user_123', name: 'Test User' });
        mockGetPlanById.mockResolvedValue({ _id: 'plan_123', active: true, price: 500, currency: 'INR', code: 'PRO' });
        mockCheckTransactionVelocity.mockResolvedValue(0);
        mockFindPendingTransaction.mockResolvedValue(null);

        const mockRzp = {
            orders: {
                create: jest.fn().mockResolvedValue({ id: 'rzp_order_123' })
            }
        };
        mockGetRazorpayClient.mockResolvedValue(mockRzp);
        mockCreatePaymentTransaction.mockResolvedValue({ _id: 'tx_123' });

        await createPaymentOrder(req as Request, res as Response);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: expect.objectContaining({
                orderId: 'rzp_order_123',
                transactionId: 'tx_123'
            })
        }));
        expect(mockRzp.orders.create).toHaveBeenCalled();
    });

    it('should reuse an existing pending transaction if available', async () => {
        mockGetUserForPayment.mockResolvedValue({ _id: 'user_123' });
        mockGetPlanById.mockResolvedValue({ _id: 'plan_123', active: true });
        mockCheckTransactionVelocity.mockResolvedValue(0);
        
        mockFindPendingTransaction.mockResolvedValue({
            _id: 'tx_existing',
            gatewayOrderId: 'order_existing',
            amount: 500,
            currency: 'INR'
        });

        await createPaymentOrder(req as Request, res as Response);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                orderId: 'order_existing',
                transactionId: 'tx_existing'
            })
        }));
        expect(mockGetRazorpayClient).not.toHaveBeenCalled();
    });

    it('should block if velocity limit is exceeded', async () => {
        mockGetUserForPayment.mockResolvedValue({ _id: 'user_123' });
        mockGetPlanById.mockResolvedValue({ _id: 'plan_123', active: true });
        mockCheckTransactionVelocity.mockResolvedValue(5); // Limit is 5

        await createPaymentOrder(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(429);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            error: expect.stringContaining('rate limit exceeded')
        }));
    });

    it('should return 404 if plan is invalid or inactive', async () => {
        mockGetUserForPayment.mockResolvedValue({ _id: 'user_123' });
        mockGetPlanById.mockResolvedValue({ _id: 'plan_bad', active: false });

        await createPaymentOrder(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            error: expect.stringContaining('Invalid or inactive plan')
        }));
    });
});
