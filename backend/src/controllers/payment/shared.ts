import crypto from 'crypto';
import Razorpay from 'razorpay';

export type InvoiceUser = {
    _id: { toString: () => string };
    name?: string;
    email?: string;
    mobile?: string;
};

export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';

export const razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
});

export const buildMockOrder = (amount: number, currency: string) => ({
    id: `order_mock_${crypto.randomBytes(4).toString('hex')}_${Date.now()}`,
    entity: 'order',
    amount,
    currency,
    status: 'created',
    attempts: 0
});
