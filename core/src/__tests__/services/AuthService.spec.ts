/**
 * AuthService — Unit Tests
 * 
 * Strategy:
 *   AuthService is the gateway to the platform. It handles identity verification 
 *   via OTP, session creation, and token issuance. We focus on securing the 
 *   state transitions (Login -> OTP -> Token) and enforcing account restrictions 
 *   (Suspensions, Locks).
 */

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('axios');

jest.mock('../../config/env', () => ({
    env: {
        NODE_ENV: 'test',
        JWT_SECRET: 'test-secret',
        JWT_EXPIRES_IN: '15m',
        OTP_PROVIDER: 'msg91',
        USE_DEFAULT_OTP: false,
        DEV_STATIC_OTP: '123456'
    }
}));

const { OtpProvider } = jest.requireActual('@esparex/contracts');

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

jest.mock('../../models/Business', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
    }
}));

jest.mock('../../domains/identity/application/auth/auth', () => ({
    generateToken: jest.fn().mockReturnValue('mock-jwt-token'),
}));

jest.mock('../../utils/otpGenerator', () => ({
    generateSecureOtp: jest.fn().mockReturnValue('123456'),
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

// ── Imports ──────────────────────────────────────────────────────────────────

import axios from 'axios';
import { env } from '../../config/env';
import { AuthService } from '../../domains/identity/application/auth/AuthService';
import User from '../../models/User';
import Otp from '../../models/Otp';
import Plan from '../../models/Plan';
import UserPlan from '../../models/UserPlan';
import Business from '../../models/Business';
import { generateToken } from '../../domains/identity/application/auth/auth';
import { verifyOtpHash } from '../../utils/otpSecurity';
import { Role } from '@esparex/contracts';
import { USER_STATUS } from '@esparex/contracts';

// ── Typed Mocks ──────────────────────────────────────────────────────────────

const mockAxios = axios as jest.Mocked<typeof axios>;
const mockUserModel = User as unknown as { findOne: jest.Mock; create: jest.Mock };
const mockOtpModel = Otp as unknown as { findOne: jest.Mock; create: jest.Mock; deleteMany: jest.Mock; deleteOne: jest.Mock };
const mockPlanModel = Plan as unknown as { findOne: jest.Mock };
const mockUserPlanModel = UserPlan as unknown as { findOneAndUpdate: jest.Mock };
const mockBusinessModel = Business as unknown as { findOne: jest.Mock };
const mockGenerateToken = generateToken as jest.Mock;
const mockVerifyOtpHash = verifyOtpHash as jest.Mock;

// ── Shared Fixtures ──────────────────────────────────────────────────────────

const MOBILE = '9876543210';
const CANONICAL_MOBILE = '+919876543210';
const USER_ID = '60b9b0b9b0b9b0b9b0b9b0b1';

const mockUser = {
    _id: USER_ID,
    mobile: CANONICAL_MOBILE,
    name: 'John Doe',
    role: Role.USER,
    status: USER_STATUS.LIVE,
    failedLoginAttempts: 0,
    lockUntil: null,
    save: jest.fn().mockResolvedValue(true),
    toObject: function() { return this; }
};

const mockOtpRecord = {
    _id: 'otp-id-123',
    mobile: CANONICAL_MOBILE,
    otpHash: 'hashed-123456',
    attempts: 0,
    expiresAt: new Date(Date.now() + 300000),
    save: jest.fn().mockResolvedValue(true)
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('sendLoginOtp', () => {
        it('should generate and send OTP for an existing active user', async () => {
            mockUserModel.findOne.mockResolvedValue(mockUser);
            mockOtpModel.findOne.mockReturnValue({
                sort: jest.fn().mockResolvedValue(null)
            });

            const result = await AuthService.sendLoginOtp(MOBILE);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.isNewUser).toBe(false);
                expect(result.name).toBe('John Doe');
            }
            expect(mockOtpModel.create).toHaveBeenCalledWith(expect.objectContaining({
                mobile: CANONICAL_MOBILE,
                otpHash: 'hashed-123456'
            }));
            // In test env, dispatchOtpSms is mocked or early returns
        });

        it('should identify a new user', async () => {
            mockUserModel.findOne.mockResolvedValue(null);
            mockOtpModel.findOne.mockReturnValue({
                sort: jest.fn().mockResolvedValue(null)
            });

            const result = await AuthService.sendLoginOtp(MOBILE);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.isNewUser).toBe(true);
            }
        });

        it('should block suspended users', async () => {
            const suspendedUser = { ...mockUser, status: 'suspended' };
            mockUserModel.findOne.mockResolvedValue(suspendedUser);

            const result = await AuthService.sendLoginOtp(MOBILE);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe('USER_SUSPENDED');
            }
        });

        it('should block banned users', async () => {
            const bannedUser = { ...mockUser, status: 'banned' };
            mockUserModel.findOne.mockResolvedValue(bannedUser);

            const result = await AuthService.sendLoginOtp(MOBILE);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe('USER_BANNED');
            }
        });

        it('should block users with active temporary locks', async () => {
            const lockedUser = { 
                ...mockUser, 
                lockUntil: new Date(Date.now() + 1000000) 
            };
            mockUserModel.findOne.mockResolvedValue(lockedUser);

            const result = await AuthService.sendLoginOtp(MOBILE);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe('OTP_LOCKED');
            }
        });
    });

    describe('verifyLoginOtp', () => {
        it('should verify correct OTP and return token for existing user', async () => {
            mockUserModel.findOne.mockResolvedValue(mockUser);
            mockOtpModel.findOne.mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockOtpRecord)
            });
            mockBusinessModel.findOne.mockResolvedValue(null);

            const result = await AuthService.verifyLoginOtp(MOBILE, '123456');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.token).toBe('mock-jwt-token');
                expect(result.user.mobile).toBe(CANONICAL_MOBILE);
            }
            expect(mockGenerateToken).toHaveBeenCalledWith(expect.objectContaining({
                role: Role.USER
            }));
        });

        it('should accept static OTP bypass before validating a fresh stored OTP record', async () => {
            const generatedOtpRecord = {
                ...mockOtpRecord,
                otpHash: 'hashed-generated-otp'
            };
            mockUserModel.findOne.mockResolvedValue(mockUser);
            mockOtpModel.findOne.mockReturnValue({
                sort: jest.fn().mockResolvedValue(generatedOtpRecord)
            });
            mockBusinessModel.findOne.mockResolvedValue(null);

            const prevProvider = env.OTP_PROVIDER;
            const prevUseDefault = env.USE_DEFAULT_OTP;
            env.OTP_PROVIDER = OtpProvider.TEST;
            env.USE_DEFAULT_OTP = true;
            try {
                const result = await AuthService.verifyLoginOtp(MOBILE, '123456');

                expect(result.success).toBe(true);
                expect(mockVerifyOtpHash).not.toHaveBeenCalled();
                expect(generatedOtpRecord.save).not.toHaveBeenCalled();
                expect(mockOtpModel.deleteMany).toHaveBeenCalled();
                if (result.success) {
                    expect(result.token).toBe('mock-jwt-token');
                    expect(result.user.mobile).toBe(CANONICAL_MOBILE);
                }
            } finally {
                env.OTP_PROVIDER = prevProvider;
                env.USE_DEFAULT_OTP = prevUseDefault;
            }
        });

        it('should create new user and assign default plan if user does not exist', async () => {
            mockUserModel.findOne.mockResolvedValue(null);
            mockOtpModel.findOne.mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockOtpRecord)
            });
            
            const newUser = { ...mockUser, _id: 'new-user-id', name: 'New User' };
            mockUserModel.create.mockResolvedValue(newUser);
            mockPlanModel.findOne.mockResolvedValue({ _id: 'plan-free-id', isDefault: true });

            const result = await AuthService.verifyLoginOtp(MOBILE, '123456', 'New User');

            expect(result.success).toBe(true);
            expect(mockUserModel.create).toHaveBeenCalledWith(expect.objectContaining({
                name: 'New User',
                mobile: CANONICAL_MOBILE
            }));
            expect(mockUserPlanModel.findOneAndUpdate).toHaveBeenCalledWith(
                expect.objectContaining({ userId: 'new-user-id', planId: 'plan-free-id' }),
                expect.any(Object),
                expect.any(Object)
            );
        });

        it('should throw error for new user registration if name is missing', async () => {
            mockUserModel.findOne.mockResolvedValue(null);
            mockOtpModel.findOne.mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockOtpRecord)
            });

            const result = await AuthService.verifyLoginOtp(MOBILE, '123456'); // No name provided

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe('NAME_REQUIRED');
            }
        });

        it('should handle invalid OTP and decrement attempts', async () => {
            mockUserModel.findOne.mockResolvedValue(mockUser);
            mockOtpModel.findOne.mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockOtpRecord)
            });

            const result = await AuthService.verifyLoginOtp(MOBILE, 'wrong-otp');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe('OTP_INVALID');
                expect(result.attemptsLeft).toBe(4); // 5 - 1
            }
            expect(mockOtpRecord.save).toHaveBeenCalled();
        });

        it('should handle expired OTP', async () => {
            const expiredOtp = { 
                ...mockOtpRecord, 
                expiresAt: new Date(Date.now() - 1000) 
            };
            mockUserModel.findOne.mockResolvedValue(mockUser);
            mockOtpModel.findOne.mockReturnValue({
                sort: jest.fn().mockResolvedValue(expiredOtp)
            });

            const result = await AuthService.verifyLoginOtp(MOBILE, 'wrong-static-otp');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe('OTP_EXPIRED');
            }
            expect(mockOtpModel.deleteOne).toHaveBeenCalledWith({ _id: expiredOtp._id });
        });

        it('should lock account after too many failed attempts', async () => {
            const nearLimitOtp = { 
                ...mockOtpRecord, 
                attempts: 4 
            };
            mockUserModel.findOne.mockResolvedValue(mockUser);
            mockOtpModel.findOne.mockReturnValue({
                sort: jest.fn().mockResolvedValue(nearLimitOtp)
            });

            const result = await AuthService.verifyLoginOtp(MOBILE, 'wrong-otp');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe('OTP_LOCKED');
                expect(result.lockUntil).toBeDefined();
            }
            expect(mockOtpModel.deleteMany).toHaveBeenCalled();
        });
    });
});
