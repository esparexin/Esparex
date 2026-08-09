import Razorpay from 'razorpay';
import crypto from 'crypto';
import { getSystemConfigDoc } from '../utils/systemConfigHelper';
import { env } from './env';

export type InvoiceUser = {
    _id: { toString: () => string };
    name?: string;
    email?: string;
    mobile?: string;
};

const DEFAULT_RAZORPAY_KEY_ID = env.RAZORPAY_KEY_ID || '';
const DEFAULT_RAZORPAY_KEY_SECRET = env.RAZORPAY_KEY_SECRET || '';

export type RazorpayRuntimeConfig = {
    enabled: boolean;
    keyId: string;
    keySecret: string;
};

export const getRazorpayRuntimeConfig = async (): Promise<RazorpayRuntimeConfig> => {
    const config = await getSystemConfigDoc();
    const razorpayConfig = config?.integrations?.payment?.razorpay;

    const dbKeyId = typeof razorpayConfig?.keyId === 'string' ? razorpayConfig.keyId.trim() : '';
    const dbKeySecret = typeof razorpayConfig?.keySecret === 'string' ? razorpayConfig.keySecret.trim() : '';

    const isDbKeyDummy = !dbKeyId || dbKeyId === 'dummy-key-id' || dbKeyId === 'rzp_test_placeholder';

    const keyId = DEFAULT_RAZORPAY_KEY_ID || (!isDbKeyDummy ? dbKeyId : '');
    const keySecret = DEFAULT_RAZORPAY_KEY_SECRET || (!isDbKeyDummy ? dbKeySecret : '');

    // Payments are enabled by default.
    // Payments are disabled ONLY if an admin explicitly configured and disabled Razorpay in SystemConfig.
    const isExplicitlyDisabledInAdmin = razorpayConfig?.enabled === false && (
        typeof razorpayConfig?.keyId === 'string' && razorpayConfig.keyId.trim().length > 0
    );
    const enabled = !isExplicitlyDisabledInAdmin;

    return {
        enabled,
        keyId,
        keySecret,
    };
};

export const getRazorpayClient = async () => {
    const { keyId, keySecret } = await getRazorpayRuntimeConfig();
    if (!keyId || !keySecret) {
        throw new Error(`Razorpay credentials missing. keyId=${keyId ? 'SET' : 'MISSING'}, keySecret=${keySecret ? 'SET' : 'MISSING'}. Check RAZORPAY_KEY_ID in backend/.env`);
    }
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
