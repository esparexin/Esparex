import crypto from 'crypto';
import Razorpay from 'razorpay';
import { getSystemConfigDoc } from '../../utils/systemConfigHelper';

export type InvoiceUser = {
    _id: { toString: () => string };
    name?: string;
    email?: string;
    mobile?: string;
};

const DEFAULT_RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
const DEFAULT_RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';

export type RazorpayRuntimeConfig = {
    enabled: boolean;
    keyId: string;
    keySecret: string;
};

export const getRazorpayRuntimeConfig = async (): Promise<RazorpayRuntimeConfig> => {
    const config = await getSystemConfigDoc();
    const razorpayConfig = config?.integrations?.payment?.razorpay;

    const keyId = (
        typeof razorpayConfig?.keyId === 'string' && razorpayConfig.keyId.trim().length > 0
            ? razorpayConfig.keyId.trim()
            : DEFAULT_RAZORPAY_KEY_ID
    );
    const keySecret = (
        typeof razorpayConfig?.keySecret === 'string' && razorpayConfig.keySecret.trim().length > 0
            ? razorpayConfig.keySecret.trim()
            : DEFAULT_RAZORPAY_KEY_SECRET
    );

    return {
        enabled: typeof razorpayConfig?.enabled === 'boolean' ? razorpayConfig.enabled : true,
        keyId,
        keySecret,
    };
};

export const getRazorpayClient = async () => {
    const { keyId, keySecret } = await getRazorpayRuntimeConfig();
    return new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });
};

export const buildMockOrder = (amount: number, currency: string) => ({
    id: `order_mock_${crypto.randomBytes(4).toString('hex')}_${Date.now()}`,
    entity: 'order',
    amount,
    currency,
    status: 'created',
    attempts: 0
});
