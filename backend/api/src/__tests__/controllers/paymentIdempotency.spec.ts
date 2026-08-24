import { createPaymentOrder } from '../../controllers/payment/paymentMutationController';
import { Request, Response } from 'express';
import {
    checkTransactionVelocity,
    findPendingTransaction,
    createPaymentTransaction,
    getUserForPayment,
} from '@esparex/core/domains/payments/application/TransactionService';
import { getPlanById } from '@esparex/core/domains/payments/application/PlanService';
import { getRazorpayClient, getRazorpayRuntimeConfig } from '@esparex/core/config/razorpay';

jest.mock('@esparex/core/domains/payments/application/TransactionService');
jest.mock('@esparex/core/domains/payments/application/PlanService');
jest.mock('@esparex/core/config/razorpay');
jest.mock('@esparex/core/utils/logger');
jest.mock('../../utils/errorResponse', () => ({
    sendErrorResponse: jest.fn((req, res, code, msg) => res.status(code).json({ success: false, error: msg })),
}));

const mockCheckTransactionVelocity = checkTransactionVelocity as jest.Mock;
const mockFindPendingTransaction = findPendingTransaction as jest.Mock;
const mockCreatePaymentTransaction = createPaymentTransaction as jest.Mock;
const mockGetUserForPayment = getUserForPayment as jest.Mock;
const mockGetPlanById = getPlanById as jest.Mock;
const mockGetRazorpayClient = getRazorpayClient as jest.Mock;
const mockGetRazorpayRuntimeConfig = getRazorpayRuntimeConfig as jest.Mock;

const VALID_PLAN_OID = '64a1f2e3b4c5d6e7f8a9b0c1';

describe('Payment Mutation Controller — Idempotency & Duplicate Prevention', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            user: { _id: 'user_123' } as any,
            body: { planId: VALID_PLAN_OID },
            headers: { 'x-idempotency-key': 'idem-test-key-456' },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        mockGetRazorpayRuntimeConfig.mockResolvedValue({ enabled: true, keyId: 'rzp_live_123' });
    });

    it('returns existing pending transaction when duplicate in-flight order request is received', async () => {
        mockGetUserForPayment.mockResolvedValue({ _id: 'user_123' });
        mockGetPlanById.mockResolvedValue({ _id: VALID_PLAN_OID, active: true, price: 999 });
        mockCheckTransactionVelocity.mockResolvedValue(0);

        mockFindPendingTransaction.mockResolvedValue({
            _id: 'tx_existing_pending',
            gatewayOrderId: 'order_rzp_existing',
            amount: 999,
            currency: 'INR',
        });

        await createPaymentOrder(req as Request, res as Response);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    orderId: 'order_rzp_existing',
                    transactionId: 'tx_existing_pending',
                    amount: 999,
                }),
            })
        );
        expect(mockGetRazorpayClient).not.toHaveBeenCalled();
        expect(mockCreatePaymentTransaction).not.toHaveBeenCalled();
    });

    it('creates new transaction and initializes gateway order when no duplicate exists', async () => {
        mockGetUserForPayment.mockResolvedValue({ _id: 'user_123' });
        mockGetPlanById.mockResolvedValue({ _id: VALID_PLAN_OID, active: true, price: 999, currency: 'INR' });
        mockCheckTransactionVelocity.mockResolvedValue(0);
        mockFindPendingTransaction.mockResolvedValue(null);

        const mockRzp = {
            orders: {
                create: jest.fn().mockResolvedValue({ id: 'order_rzp_fresh_789' }),
            },
        };
        mockGetRazorpayClient.mockResolvedValue(mockRzp);
        mockCreatePaymentTransaction.mockResolvedValue({ _id: 'tx_fresh_789' });

        await createPaymentOrder(req as Request, res as Response);

        expect(mockRzp.orders.create).toHaveBeenCalled();
        expect(mockCreatePaymentTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 'user_123',
                gatewayOrderId: 'order_rzp_fresh_789',
            })
        );
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    orderId: 'order_rzp_fresh_789',
                    transactionId: 'tx_fresh_789',
                }),
            })
        );
    });
});
