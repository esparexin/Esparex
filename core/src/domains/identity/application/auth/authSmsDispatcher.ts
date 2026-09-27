import axios from 'axios';
import logger from '../../../../utils/logger';
import { env } from '../../../../config/env';
import { isStaticOtpBypassEnabled } from './authOtpHelpers';

export interface ProviderDispatchResult {
    success: boolean;
    reqId?: string;
    error?: string;
}

export interface ProviderVerifyResult {
    success: boolean;
    error?: string;
    isExpired?: boolean;
    isInvalid?: boolean;
}

/**
 * Dispatch OTP via WhatsApp using MSG91 EsparexLogin OTP Widget API.
 * Phase requirement: WhatsApp OTP = ENABLED, SMS OTP = DISABLED.
 */
export const dispatchOtpWhatsApp = async (mobile: string): Promise<ProviderDispatchResult> => {
    if (isStaticOtpBypassEnabled()) {
        if (env.NODE_ENV === 'production') {
            logger.warn('[OTP] STATIC OTP BYPASS ACTIVE (TEST MODE) — WhatsApp dispatch skipped.');
        } else {
            logger.info('Static OTP fallback active — skipping WhatsApp dispatch', { phone: mobile.slice(-4) });
        }
        return { success: true, reqId: 'static-bypass-req-id' };
    }

    if (!env.MSG91_AUTH_KEY || !env.MSG91_WIDGET_ID) {
        if (env.NODE_ENV === 'production') {
            logger.error('MSG91 WhatsApp OTP provider not configured in production (missing MSG91_AUTH_KEY or MSG91_WIDGET_ID)');
            return {
                success: false,
                error: 'OTP authentication service is not properly configured.'
            };
        }
        logger.warn('MSG91 WhatsApp OTP provider not configured; dispatch skipped in dev mode', { phone: mobile.slice(-4) });
        return { success: true, reqId: 'dev-mock-req-id' };
    }

    try {
        const identifier = mobile.startsWith('+91')
            ? mobile.slice(1)
            : `91${mobile.replace(/\D/g, '').slice(-10)}`;

        const payload: Record<string, unknown> = {
            widgetId: env.MSG91_WIDGET_ID,
            identifier,
        };

        if (!env.MSG91_AUTH_KEY && env.MSG91_TOKEN_AUTH) {
            payload.tokenAuth = env.MSG91_TOKEN_AUTH;
        }

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (env.MSG91_AUTH_KEY) {
            headers.authkey = env.MSG91_AUTH_KEY;
        }

        const response = await axios.post(
            'https://api.msg91.com/api/v5/widget/sendOtp',
            payload,
            {
                headers,
                timeout: 8000
            }
        );

        const responseData = response.data as { type?: string; message?: string; reqId?: string; requestId?: string } | undefined;
        if (responseData?.type === 'success' || (response.status >= 200 && response.status < 300 && responseData?.type !== 'error')) {
            const rawMessage = responseData?.message;
            const messageIsId = typeof rawMessage === 'string' && /^[0-9a-zA-Z_-]{10,40}$/.test(rawMessage.trim());
            const reqId = responseData?.reqId || responseData?.requestId || (messageIsId ? rawMessage.trim() : undefined);
            logger.info('WhatsApp OTP dispatched successfully via MSG91 widget', {
                phone: mobile.slice(-4),
                hasReqId: Boolean(reqId)
            });
            return { success: true, reqId };
        }

        logger.warn('WhatsApp OTP dispatch returned non-success', {
            phone: mobile.slice(-4),
            type: responseData?.type,
            message: responseData?.message
        });
        return {
            success: false,
            error: responseData?.message || 'Failed to deliver OTP via WhatsApp.'
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error('WhatsApp OTP dispatch failed', { phone: mobile.slice(-4), error: message });
        return {
            success: false,
            error: 'Failed to deliver OTP via WhatsApp. Please try again.'
        };
    }
};

/**
 * Retry/Resend OTP via WhatsApp using MSG91 EsparexLogin OTP Widget retry API.
 * MSG91 Channel 12 = WhatsApp.
 */
export const retryOtpWhatsApp = async (mobile: string, reqId?: string): Promise<ProviderDispatchResult> => {
    if (isStaticOtpBypassEnabled()) {
        return { success: true, reqId: 'static-bypass-req-id' };
    }

    if (!env.MSG91_AUTH_KEY || !env.MSG91_WIDGET_ID) {
        if (env.NODE_ENV === 'production') {
            return {
                success: false,
                error: 'OTP authentication service is not properly configured.'
            };
        }
        return { success: true, reqId: reqId || 'dev-mock-req-id' };
    }

    if (!reqId) {
        // Fallback to fresh sendOtp if no existing reqId
        return dispatchOtpWhatsApp(mobile);
    }

    try {
        const payload: Record<string, unknown> = {
            widgetId: env.MSG91_WIDGET_ID,
            reqId,
            retryChannel: 12 // 12 = WhatsApp in MSG91 OTP Widget
        };

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (env.MSG91_AUTH_KEY) {
            headers.authkey = env.MSG91_AUTH_KEY;
        }

        const response = await axios.post(
            'https://api.msg91.com/api/v5/widget/retryOtp',
            payload,
            {
                headers,
                timeout: 8000
            }
        );

        const responseData = response.data as { type?: string; message?: string } | undefined;
        if (responseData?.type === 'success' || (response.status >= 200 && response.status < 300 && responseData?.type !== 'error')) {
            logger.info('WhatsApp OTP retry dispatched successfully via MSG91 widget', { phone: mobile.slice(-4) });
            return { success: true, reqId };
        }

        logger.warn('WhatsApp OTP retry returned non-success', {
            phone: mobile.slice(-4),
            type: responseData?.type,
            message: responseData?.message
        });
        return {
            success: false,
            error: responseData?.message || 'Failed to resend WhatsApp OTP.'
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error('WhatsApp OTP retry failed', { phone: mobile.slice(-4), error: message });
        return {
            success: false,
            error: 'Failed to resend WhatsApp OTP. Please try again.'
        };
    }
};

/**
 * Server-side OTP verification with MSG91 OTP Widget API.
 * Keeps verification ownership on the backend.
 */
export const verifyOtpWithProvider = async (reqId: string, otp: string): Promise<ProviderVerifyResult> => {
    if (isStaticOtpBypassEnabled()) {
        return { success: true };
    }

    if (!env.MSG91_AUTH_KEY || !env.MSG91_WIDGET_ID) {
        if (env.NODE_ENV === 'production') {
            return {
                success: false,
                error: 'OTP authentication service is not properly configured.'
            };
        }
        return { success: true };
    }

    try {
        const payload = {
            widgetId: env.MSG91_WIDGET_ID,
            reqId,
            otp
        };

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (env.MSG91_AUTH_KEY) {
            headers.authkey = env.MSG91_AUTH_KEY;
        }

        const response = await axios.post(
            'https://api.msg91.com/api/v5/widget/verifyOtp',
            payload,
            {
                headers,
                timeout: 8000
            }
        );

        const data = response.data as { type?: string; message?: string } | undefined;
        const msg = (data?.message || '').toLowerCase();

        if (data?.type === 'success' || msg.includes('success') || msg.includes('verified')) {
            return { success: true };
        }

        if (msg.includes('expired')) {
            return { success: false, isExpired: true, error: 'OTP has expired.' };
        }

        if (msg.includes('not match') || msg.includes('invalid') || msg.includes('incorrect')) {
            return { success: false, isInvalid: true, error: 'Invalid OTP.' };
        }

        return {
            success: false,
            isInvalid: true,
            error: data?.message || 'Invalid OTP.'
        };
    } catch (err: unknown) {
        const errData = (axios.isAxiosError(err) ? err.response?.data : undefined) as { type?: string; message?: string } | undefined;
        const errMessage = (errData?.message || (err instanceof Error ? err.message : String(err))).toLowerCase();

        if (errMessage.includes('expired')) {
            return { success: false, isExpired: true, error: 'OTP has expired.' };
        }
        if (errMessage.includes('not match') || errMessage.includes('invalid') || errMessage.includes('incorrect')) {
            return { success: false, isInvalid: true, error: 'Invalid OTP.' };
        }

        logger.error('MSG91 server-side OTP verification request failed', { error: errMessage });
        return {
            success: false,
            error: 'Server-side OTP verification failed. Please try again.'
        };
    }
};

/**
 * SMS OTP is explicitly DISABLED in this phase.
 * Calling this function will throw an error to guarantee no SMS is ever sent.
 */
export const dispatchOtpSms = async (): Promise<void> => {
    logger.warn('SMS OTP is DISABLED in this phase. WhatsApp OTP is the only active channel.');
    throw new Error('SMS OTP is disabled in this phase. WhatsApp OTP only.');
};
