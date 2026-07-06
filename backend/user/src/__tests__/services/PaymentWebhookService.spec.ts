/**
 * PaymentWebhookService — Unit Tests
 * 
 * Strategy:
 *   The webhook controller is the entry point for Razorpay callbacks. We test 
 *   payload parsing, event filtering, and job enqueuing. We ensure that only 
 *   relevant financial events ('payment.captured', 'order.paid') are enqueued 
 *   for processing to avoid unnecessary worker load.
 */

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@esparex/core/queues/paymentQueue', () => ({
    enqueuePaymentProcessing: jest.fn().mockResolvedValue({ id: 'job_123' }),
}));

jest.mock('@esparex/core/utils/logger', () => ({
    __esModule: true,
    default: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
    logBusiness: jest.fn(),
}));

jest.mock('@esparex/core/utils/errorResponse', () => ({
    sendErrorResponse: jest.fn((req, res, code, msg) => res.status(code).json({ success: false, message: msg })),
}));

// ── Imports ──────────────────────────────────────────────────────────────────

import { paymentWebhook } from '../../controllers/payment/paymentWebhook';
import { enqueuePaymentProcessing } from '@esparex/core/queues';;
import { Request, Response } from 'express';

// ── Typed Mocks ──────────────────────────────────────────────────────────────

const mockEnqueue = enqueuePaymentProcessing as jest.Mock;

// ── Helpers ──────────────────────────────────────────────────────────────────

const mockRes = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('PaymentWebhookService — paymentWebhook Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully enqueue a payment.captured event', async () => {
        const req = {
            headers: { 'x-razorpay-signature': 'valid_sig' },
            body: {
                event: 'payment.captured',
                payload: {
                    payment: {
                        entity: {
                            id: 'pay_123',
                            order_id: 'order_456',
                            amount: 50000,
                            currency: 'INR'
                        }
                    }
                }
            }
        } as unknown as Request;
        const res = mockRes();

        await paymentWebhook(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
            event: 'payment.captured',
            gatewayPaymentId: 'pay_123',
            gatewayOrderId: 'order_456',
            gatewayAmountPaise: 50000
        }));
    });

    it('should successfully enqueue an order.paid event', async () => {
        const req = {
            headers: { 'x-razorpay-signature': 'valid_sig' },
            body: {
                event: 'order.paid',
                payload: {
                    order: {
                        entity: {
                            id: 'order_789',
                            amount: 100000,
                            currency: 'INR'
                        }
                    },
                    payment: {
                        entity: {
                            id: 'pay_789',
                            order_id: 'order_789'
                        }
                    }
                }
            }
        } as unknown as Request;
        const res = mockRes();

        await paymentWebhook(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(mockEnqueue).toHaveBeenCalledWith(expect.objectContaining({
            event: 'order.paid',
            gatewayOrderId: 'order_789',
            gatewayPaymentId: 'pay_789'
        }));
    });

    it('should ignore irrelevant events (e.g. payment.failed)', async () => {
        const req = {
            headers: { 'x-razorpay-signature': 'valid_sig' },
            body: {
                event: 'payment.failed',
                payload: { payment: { entity: { id: 'pay_fail' } } }
            }
        } as unknown as Request;
        const res = mockRes();

        await paymentWebhook(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(mockEnqueue).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid payload structure', async () => {
        const req = {
            headers: { 'x-razorpay-signature': 'valid_sig' },
            body: {} // Empty body
        } as unknown as Request;
        const res = mockRes();

        await paymentWebhook(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for missing signature', async () => {
        const req = {
            headers: {}, // Missing signature
            body: { event: 'payment.captured', payload: { payment: { entity: {} } } }
        } as unknown as Request;
        const res = mockRes();

        await paymentWebhook(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 500 if enqueuing fails', async () => {
        const req = {
            headers: { 'x-razorpay-signature': 'valid_sig' },
            body: {
                event: 'payment.captured',
                payload: { payment: { entity: { id: 'pay_err' } } }
            }
        } as unknown as Request;
        const res = mockRes();
        mockEnqueue.mockRejectedValue(new Error('QUEUE_DOWN'));

        await paymentWebhook(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});
