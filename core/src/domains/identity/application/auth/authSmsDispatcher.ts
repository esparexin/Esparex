import axios from 'axios';
import logger from '../../../../utils/logger';
import { env } from '../../../../config/env';
import { isStaticOtpBypassEnabled } from './authOtpHelpers';

export const dispatchOtpSms = async (mobile: string, otp: string): Promise<void> => {
    if (env.NODE_ENV === 'test') return;

    if (isStaticOtpBypassEnabled()) {
        if (env.NODE_ENV === 'production') {
            logger.warn('[OTP] STATIC OTP BYPASS ACTIVE (DLT PENDING) — static OTP 123456 active, SMS dispatch skipped.');
        } else {
            logger.info('Static OTP fallback active — skipping SMS dispatch', { phone: mobile.slice(-4) });
        }
        return;
    }

    if (!env.MSG91_AUTH_KEY || !env.MSG91_SENDER_ID) {
        logger.warn('OTP SMS provider not configured; OTP dispatch skipped', { phone: mobile.slice(-4) });
        return;
    }

    try {
        const response = await axios.post(
            'https://api.msg91.com/api/v5/otp',
            {
                template_id: env.MSG91_TEMPLATE_ID,
                mobile: mobile.startsWith('+91') ? mobile.slice(1) : `91${mobile.replace(/\D/g, '').slice(-10)}`,
                authkey: env.MSG91_AUTH_KEY,
                otp
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 8000
            }
        );

        const responseData = response.data as { type?: string } | undefined;
        if (responseData?.type === 'success') {
            logger.info('OTP SMS dispatched successfully', { phone: mobile.slice(-4) });
        } else {
            logger.warn('OTP SMS dispatch returned non-success', {
                phone: mobile.slice(-4),
                type: responseData?.type
            });
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error('OTP SMS dispatch failed', { phone: mobile.slice(-4), error: message });
    }
};
