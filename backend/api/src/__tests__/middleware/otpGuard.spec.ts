import { OtpProvider } from '@esparex/contracts';
import {
    getOtpGuardState,
    otpHealthCheck,
    validateOtpConfiguration,
} from '../../middleware/otpGuard';

/**
 * Regression coverage for the Oct 2026 send-otp incident: production booted
 * with OTP_PROVIDER=msg91 but without MSG91 widget credentials, so every
 * POST /api/v1/auth/send-otp failed with 502 OTP_DELIVERY_FAILED while
 * /health stayed green for ~150h. Startup must now fail fast instead.
 */
describe('otpGuard production fail-fast', () => {
    it('throws at startup when OTP_PROVIDER=msg91 lacks widget credentials in production', () => {
        expect(() =>
            validateOtpConfiguration({
                isProduction: true,
                isDevelopment: false,
                isTest: false,
                msg91AuthKey: undefined,
                msg91SenderId: undefined,
                msg91WidgetId: undefined,
                authBypassOtpLock: undefined,
                otpProvider: OtpProvider.MSG91,
            })
        ).toThrow(/MSG91_WIDGET_ID/);
    });

    it('boots cleanly when widget credentials are present in production', () => {
        expect(() =>
            validateOtpConfiguration({
                isProduction: true,
                isDevelopment: false,
                isTest: false,
                msg91AuthKey: 'test-auth-key',
                msg91SenderId: undefined,
                msg91WidgetId: 'test-widget-id',
                authBypassOtpLock: undefined,
                otpProvider: OtpProvider.MSG91,
            })
        ).not.toThrow();
        expect(getOtpGuardState().isSafeToProceed).toBe(true);
        expect(otpHealthCheck().status).toBe('healthy');
    });

    it('keeps OTP_PROVIDER=test bootable in production (static OTP mode)', () => {
        expect(() =>
            validateOtpConfiguration({
                isProduction: true,
                isDevelopment: false,
                isTest: false,
                msg91AuthKey: undefined,
                msg91SenderId: undefined,
                msg91WidgetId: undefined,
                authBypassOtpLock: undefined,
                otpProvider: OtpProvider.TEST,
            })
        ).not.toThrow();
        expect(getOtpGuardState().isConfigured).toBe(true);
    });
});
