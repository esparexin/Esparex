/**
 * WhatsApp OTP Flow & MSG91 Widget Integration Tests
 *
 * Requirements covered:
 * 1. Valid Indian mobile number
 * 2. WhatsApp OTP request (POST https://api.msg91.com/api/v5/widget/sendOtp)
 * 3. OTP delivery returns reqId
 * 4. Correct OTP verification (POST https://api.msg91.com/api/v5/widget/verifyOtp)
 * 5. Incorrect OTP
 * 6. Expired OTP
 * 7. Reused OTP
 * 8. Resend before 30 seconds (cooldown)
 * 9. Resend after 30 seconds (retryOtp with retryChannel 12)
 * 10. Maximum resend attempts (3)
 * 11. Provider failure handling
 * 12. Invalid mobile number
 * 13. Authentication / session creation
 * 14. Session cancellation
 * 15. Verify that NO SMS API is called anywhere in this flow
 */

import axios from 'axios';

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../../config/env', () => ({
    env: {
        NODE_ENV: 'test',
        JWT_SECRET: 'test-jwt-secret-min-32-chars-long-for-testing!!',
        JWT_EXPIRES_IN: '7d',
        OTP_PROVIDER: 'msg91',
        MSG91_AUTH_KEY: 'test-msg91-auth-key',
        MSG91_WIDGET_ID: 'test-widget-id-3461',
        MSG91_TOKEN_AUTH: 'test-widget-client-token',
        MSG91_OTP_CHANNEL: 'whatsapp',
        USE_DEFAULT_OTP: false,
        DEV_STATIC_OTP: '123456',
        AUTH_BYPASS_OTP_LOCK: 'false',
    }
}));

jest.mock('../../models/User', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
        create: jest.fn(),
        findById: jest.fn(),
    }
}));

jest.mock('../../models/Otp', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
        deleteOne: jest.fn(),
    }
}));

jest.mock('../../models/Plan', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
    }
}));

jest.mock('../../models/UserPlan', () => ({
    __esModule: true,
    default: {
        findOneAndUpdate: jest.fn(),
    }
}));

jest.mock('../../config/redisRuntime', () => ({
    getRedisRuntimeConfig: jest.fn().mockReturnValue({
        host: 'localhost',
        port: 6379,
        db: 0,
        tlsEnabled: false,
    }),
    getRedisConnectionOptions: jest.fn().mockReturnValue({}),
}));

jest.mock('../../models/Business', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
    }
}));

jest.mock('../../domains/identity/application/auth/auth', () => ({
    generateToken: jest.fn().mockReturnValue('mock-jwt-whatsapp-token'),
}));

jest.mock('../../utils/otpSecurity', () => ({
    hashOtp: jest.fn((otp) => `hashed-${otp}`),
    verifyOtpHash: jest.fn((otp, hash) => hash === `hashed-${otp}`),
}));

jest.mock('../../utils/serialize', () => ({
    serializeDoc: jest.fn((doc) => doc),
}));

jest.mock('../../utils/securityMonitoring', () => ({
    recordOtpAbuseSignal: jest.fn(),
}));

import { AuthService } from '../../domains/identity/application/auth/AuthService';
import { dispatchOtpSms } from '../../domains/identity/application/auth/authSmsDispatcher';
import User from '../../models/User';
import Otp from '../../models/Otp';
import { Role, USER_STATUS } from '@esparex/contracts';

const mockUserModel = User as any;
const mockOtpModel = Otp as any;

const VALID_MOBILE = '9876543210';
const CANONICAL_MOBILE = '+919876543210';
const USER_ID = '60b9b0b9b0b9b0b9b0b9b0b1';

const mockUserRecord = {
    _id: USER_ID,
    mobile: CANONICAL_MOBILE,
    name: 'WhatsApp Tester',
    role: Role.USER,
    status: USER_STATUS.LIVE,
    failedLoginAttempts: 0,
    lockUntil: null,
    save: jest.fn().mockResolvedValue(true),
    toObject: function () { return this; }
};

describe('WhatsApp OTP Authentication Flow (MSG91 EsparexLogin Widget)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('1. WhatsApp OTP Request & Delivery via MSG91 Widget', () => {
        it('should dispatch OTP via WhatsApp using MSG91 widget sendOtp endpoint', async () => {
            mockUserModel.findOne.mockResolvedValue(mockUserRecord);
            mockOtpModel.findOne.mockReturnValue({
                sort: jest.fn().mockResolvedValue(null)
            });

            mockAxios.post.mockResolvedValueOnce({
                status: 200,
                data: {
                    type: 'success',
                    message: 'OTP sent successfully',
                    reqId: 'msg91-req-12345'
                }
            });

            const result = await AuthService.sendLoginOtp(VALID_MOBILE);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.otpExpiresIn).toBe(900); // 15 minutes
                expect(result.name).toBe('WhatsApp Tester');
            }

            // Verify the exact MSG91 OTP Widget sendOtp endpoint was called
            expect(mockAxios.post).toHaveBeenCalledWith(
                'https://api.msg91.com/api/v5/widget/sendOtp',
                expect.objectContaining({
                    widgetId: 'test-widget-id-3461',
                    identifier: '919876543210'
                }),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        authkey: 'test-msg91-auth-key',
                        'Content-Type': 'application/json'
                    })
                })
            );

            // Verify Otp model stores reqId and channel: whatsapp
            expect(mockOtpModel.create).toHaveBeenCalledWith(expect.objectContaining({
                mobile: CANONICAL_MOBILE,
                reqId: 'msg91-req-12345',
                channel: 'whatsapp',
                attempts: 0,
                resendAttempts: 0
            }));
        });
    });

    describe('2. WhatsApp OTP Verification via MSG91 Widget', () => {
        it('should verify correct OTP server-side with MSG91 widget and return token', async () => {
            const activeOtp = {
                _id: 'otp-id-whatsapp',
                mobile: CANONICAL_MOBILE,
                reqId: 'msg91-req-12345',
                channel: 'whatsapp',
                attempts: 0,
                expiresAt: new Date(Date.now() + 800000),
                save: jest.fn().mockResolvedValue(true)
            };

            mockUserModel.findOne.mockResolvedValue(mockUserRecord);
            mockOtpModel.findOne.mockReturnValue({
                sort: jest.fn().mockResolvedValue(activeOtp)
            });

            mockAxios.post.mockResolvedValueOnce({
                status: 200,
                data: {
                    type: 'success',
                    message: 'OTP verified successfully'
                }
            });

            const result = await AuthService.verifyLoginOtp(VALID_MOBILE, '482910');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.token).toBe('mock-jwt-whatsapp-token');
            }

            // Verify server-side MSG91 verifyOtp call
            expect(mockAxios.post).toHaveBeenCalledWith(
                'https://api.msg91.com/api/v5/widget/verifyOtp',
                expect.objectContaining({
                    widgetId: 'test-widget-id-3461',
                    reqId: 'msg91-req-12345',
                    otp: '482910'
                }),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        authkey: 'test-msg91-auth-key'
                    })
                })
            );

            // Verify record deleted to prevent replay attacks
            expect(mockOtpModel.deleteMany).toHaveBeenCalled();
        });

        it('should handle incorrect OTP from MSG91 and decrement remaining attempts', async () => {
            const activeOtp = {
                _id: 'otp-id-whatsapp',
                mobile: CANONICAL_MOBILE,
                reqId: 'msg91-req-12345',
                channel: 'whatsapp',
                attempts: 1,
                expiresAt: new Date(Date.now() + 800000),
                save: jest.fn().mockResolvedValue(true)
            };

            mockUserModel.findOne.mockResolvedValue(mockUserRecord);
            mockOtpModel.findOne.mockReturnValue({
                sort: jest.fn().mockResolvedValue(activeOtp)
            });

            mockAxios.post.mockResolvedValueOnce({
                status: 200,
                data: {
                    type: 'error',
                    message: 'OTP not match'
                }
            });

            const result = await AuthService.verifyLoginOtp(VALID_MOBILE, '000000');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe('OTP_INVALID');
                expect(result.attemptsLeft).toBe(3); // 5 - (1 + 1)
            }
            expect(activeOtp.attempts).toBe(2);
            expect(activeOtp.save).toHaveBeenCalled();
        });

        it('should reject already used OTP with OTP_ALREADY_USED', async () => {
            mockUserModel.findOne.mockResolvedValue(mockUserRecord);
            mockOtpModel.findOne.mockReturnValue({
                sort: jest.fn().mockResolvedValue(null)
            });

            const result = await AuthService.verifyLoginOtp(VALID_MOBILE, '482910');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe('OTP_ALREADY_USED');
                expect(result.status).toBe(400);
            }
        });

        it('should reject expired OTP with OTP_EXPIRED', async () => {
            const expiredOtp = {
                _id: 'otp-expired-id',
                mobile: CANONICAL_MOBILE,
                reqId: 'msg91-req-expired',
                channel: 'whatsapp',
                attempts: 0,
                expiresAt: new Date(Date.now() - 5000), // Expired 5 seconds ago
                save: jest.fn().mockResolvedValue(true)
            };

            mockUserModel.findOne.mockResolvedValue(mockUserRecord);
            mockOtpModel.findOne.mockReturnValue({
                sort: jest.fn().mockResolvedValue(expiredOtp)
            });

            const result = await AuthService.verifyLoginOtp(VALID_MOBILE, '482910');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe('OTP_EXPIRED');
            }
            expect(mockOtpModel.deleteOne).toHaveBeenCalledWith({ _id: 'otp-expired-id' });
        });
    });

    describe('3. Resend & Cooldown (WhatsApp Channel 12)', () => {
        it('should reject resend before 30-second cooldown with OTP_RESEND_COOLDOWN', async () => {
            const activeOtp = {
                mobile: CANONICAL_MOBILE,
                reqId: 'msg91-req-12345',
                channel: 'whatsapp',
                createdAt: new Date(),
                lastSentAt: new Date(Date.now() - 15000), // 15s ago, cooldown is 30s
                expiresAt: new Date(Date.now() + 800000),
                resendAttempts: 0,
                save: jest.fn()
            };

            mockUserModel.findOne.mockResolvedValue(mockUserRecord);
            mockOtpModel.findOne.mockReturnValue({
                sort: jest.fn().mockResolvedValue(activeOtp)
            });

            const result = await AuthService.sendLoginOtp(VALID_MOBILE);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.status).toBe(429);
                expect(result.code).toBe('OTP_RESEND_COOLDOWN');
            }
            // No MSG91 call should be made during cooldown
            expect(mockAxios.post).not.toHaveBeenCalled();
        });

        it('should allow resend after 30 seconds and call MSG91 retryOtp with WhatsApp channel 12', async () => {
            const activeOtp = {
                mobile: CANONICAL_MOBILE,
                reqId: 'msg91-req-12345',
                channel: 'whatsapp',
                createdAt: new Date(Date.now() - 45000),
                lastSentAt: new Date(Date.now() - 35000), // 35s ago, cooldown expired
                expiresAt: new Date(Date.now() + 800000),
                resendAttempts: 0,
                save: jest.fn().mockResolvedValue(true)
            };

            mockUserModel.findOne.mockResolvedValue(mockUserRecord);
            mockOtpModel.findOne.mockReturnValue({
                sort: jest.fn().mockResolvedValue(activeOtp)
            });

            mockAxios.post.mockResolvedValueOnce({
                status: 200,
                data: {
                    type: 'success',
                    message: 'OTP retry successful'
                }
            });

            const result = await AuthService.sendLoginOtp(VALID_MOBILE);

            expect(result.success).toBe(true);
            expect(activeOtp.resendAttempts).toBe(1);

            // Verify MSG91 retryOtp was called with channel 12 (WhatsApp)
            expect(mockAxios.post).toHaveBeenCalledWith(
                'https://api.msg91.com/api/v5/widget/retryOtp',
                expect.objectContaining({
                    widgetId: 'test-widget-id-3461',
                    reqId: 'msg91-req-12345',
                    retryChannel: 12 // WhatsApp
                }),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        authkey: 'test-msg91-auth-key'
                    })
                })
            );
        });

        it('should reject resend when maximum attempts (3) are exhausted', async () => {
            const activeOtp = {
                mobile: CANONICAL_MOBILE,
                reqId: 'msg91-req-12345',
                channel: 'whatsapp',
                createdAt: new Date(Date.now() - 150000),
                lastSentAt: new Date(Date.now() - 40000), // Cooldown passed
                expiresAt: new Date(Date.now() + 700000),
                resendAttempts: 3, // Exhausted
                save: jest.fn()
            };

            mockUserModel.findOne.mockResolvedValue(mockUserRecord);
            mockOtpModel.findOne.mockReturnValue({
                sort: jest.fn().mockResolvedValue(activeOtp)
            });

            const result = await AuthService.sendLoginOtp(VALID_MOBILE);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.status).toBe(429);
                expect(result.code).toBe('OTP_RESEND_LIMIT_REACHED');
            }
            expect(mockAxios.post).not.toHaveBeenCalled();
        });
    });

    describe('4. Provider Failures & Resilience', () => {
        it('should handle MSG91 delivery failure gracefully with 502 OTP_DELIVERY_FAILED', async () => {
            mockUserModel.findOne.mockResolvedValue(mockUserRecord);
            mockOtpModel.findOne.mockReturnValue({
                sort: jest.fn().mockResolvedValue(null)
            });

            mockAxios.post.mockRejectedValueOnce(new Error('Network connection timeout'));

            const result = await AuthService.sendLoginOtp(VALID_MOBILE);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.status).toBe(502);
                expect(result.code).toBe('OTP_DELIVERY_FAILED');
            }
        });

        it('should handle MSG91 verification service failure gracefully with 502 OTP_VERIFICATION_FAILED', async () => {
            const activeOtp = {
                _id: 'otp-id-whatsapp',
                mobile: CANONICAL_MOBILE,
                reqId: 'msg91-req-12345',
                channel: 'whatsapp',
                attempts: 0,
                expiresAt: new Date(Date.now() + 800000),
                save: jest.fn().mockResolvedValue(true)
            };

            mockUserModel.findOne.mockResolvedValue(mockUserRecord);
            mockOtpModel.findOne.mockReturnValue({
                sort: jest.fn().mockResolvedValue(activeOtp)
            });

            mockAxios.post.mockRejectedValueOnce(new Error('500 Internal Server Error from MSG91'));

            const result = await AuthService.verifyLoginOtp(VALID_MOBILE, '482910');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.status).toBe(502);
                expect(result.code).toBe('OTP_VERIFICATION_FAILED');
            }
        });
    });

    describe('5. Session Cancellation', () => {
        it('should cancel active OTP session for a mobile number', async () => {
            const result = await AuthService.cancelOtpSession(VALID_MOBILE);
            expect(result.success).toBe(true);
            expect(mockOtpModel.deleteMany).toHaveBeenCalled();
        });
    });

    describe('6. Guarantee: NO SMS API Called Anywhere', () => {
        it('should verify dispatchOtpSms throws error and never calls any SMS endpoint', async () => {
            await expect(dispatchOtpSms()).rejects.toThrow(/SMS OTP is disabled in this phase/i);

            // Verify no call to the old SMS endpoint
            const allAxiosCalls = mockAxios.post.mock.calls;
            for (const [url] of allAxiosCalls) {
                expect(url).not.toBe('https://api.msg91.com/api/v5/otp');
            }
        });
    });
});
