import crypto from "crypto";
import type { Request, Response } from "express";

jest.mock("@esparex/core/models/Admin", () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
        findById: jest.fn(),
        updateOne: jest.fn(),
    },
}));

jest.mock("@esparex/core/utils/systemConfigHelper", () => ({
    __esModule: true,
    getSystemConfigDoc: jest.fn().mockResolvedValue({}),
}));

jest.mock("@esparex/core/utils/cookieHelper", () => ({
    __esModule: true,
    getAdminCookieOptions: jest.fn(() => ({
        path: "/api/v1/admin",
    })),
    getAuthCookieOptions: jest.fn(() => ({
        path: "/",
    })),
}));

jest.mock("@esparex/core/utils/auth", () => ({
    __esModule: true,

    comparePassword: jest.fn().mockResolvedValue(true),

    generateAdminToken: jest.fn(() => "jwt_admin_token"),

    verifyAdminToken: jest.fn(() => ({
        id: "507f1f77bcf86cd799439011",
        role: "admin",
        jti: "session_jti_1",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        sub: "507f1f77bcf86cd799439011",
    })),
}));

jest.mock("@esparex/core/services/AdminSessionService", () => ({
    __esModule: true,

    createAdminSession: jest.fn().mockResolvedValue(undefined),

    revokeAdminSession: jest.fn().mockResolvedValue(undefined),

    revokeAdminSessionsForAdmin: jest.fn().mockResolvedValue(undefined),

    getAdminSessionTtlMs: jest.fn(
        () => 8 * 60 * 60 * 1000
    ),
}));

jest.mock("@esparex/core/domains/notifications/application/EmailService", () => ({
    __esModule: true,

    emailService: {
        sendEmail: jest.fn().mockResolvedValue(true),
    },
}));

jest.mock("../../utils/adminLogger", () => ({
    __esModule: true,

    logAdminAction: jest.fn().mockResolvedValue(undefined),
}));



import Admin from "@esparex/core/models/Admin";
import { USER_STATUS } from "@esparex/contracts";
import {
    revokeAdminSessionsForAdmin,
} from "@esparex/core/services/AdminSessionService";

import {
    adminLogin,
    resetPassword,
} from "../../controllers/admin/system/adminAuthController";

const createMockRes = (
    req?: Partial<Request>
) => {
    const res = {
        status: jest.fn().mockReturnThis(),

        json: jest.fn().mockReturnThis(),

        cookie: jest.fn(),

        clearCookie: jest.fn(),
    } as any;

    if (req) {
        res.req = req as Request;
    }

    return res;
};

describe(
    "admin auth lifecycle regressions",
    () => {
        const mockAdmin =
            Admin as any;

        const mockRevokeAdminSessionsForAdmin =
            revokeAdminSessionsForAdmin as jest.Mock;

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it(
            "logs in successfully for LIVE admin (POST /api/v1/admin/login flow)",
            async () => {
                const activeAdmin = {
                    _id: {
                        toString: () =>
                            "507f1f77bcf86cd799439011",
                    },

                    firstName: "Ops",

                    lastName: "Lead",

                    email: "ops@example.com",

                    password:
                        "hashed-password",

                    role: "super_admin",

                    status:
                        USER_STATUS.LIVE,

                    permissions: [
                        "system:config",
                    ],

                    twoFactorEnabled:
                        false,

                    comparePassword:
                        jest
                            .fn()
                            .mockResolvedValue(
                                true
                            ),

                    toObject: jest.fn(
                        () => ({
                            _id: {
                                toString:
                                    () =>
                                        "507f1f77bcf86cd799439011",
                            },

                            firstName:
                                "Ops",

                            lastName:
                                "Lead",

                            email:
                                "ops@example.com",

                            role: "super_admin",

                            status:
                                USER_STATUS.LIVE,

                            permissions:
                                [
                                    "system:config",
                                ],
                        })
                    ),
                };

                mockAdmin.findOne.mockReturnValue(
                    {
                        select: jest
                            .fn()
                            .mockResolvedValue(
                                activeAdmin
                            ),
                    }
                );

                const req = {
                    body: {
                        email:
                            "ops@example.com",

                        password:
                            "Admin@12345",
                    },

                    headers: {
                        "user-agent":
                            "jest-agent",
                    },

                    socket: {
                        remoteAddress:
                            "127.0.0.1",
                    },

                    originalUrl:
                        "/api/v1/admin/login",
                } as any;

                const res =
                    createMockRes(req);

                await adminLogin(
                    req,
                    res
                );

                expect(
                    mockAdmin.findOne
                ).toHaveBeenCalledWith(
                    {
                        email:
                            "ops@example.com",
                    }
                );

                expect(
                    res.status
                ).toHaveBeenCalledWith(
                    200
                );

                expect(
                    res.json
                ).toHaveBeenCalledWith(
                    expect.objectContaining(
                        {
                            success: true,

                            data:
                                expect.objectContaining(
                                    {
                                        accessToken:
                                            "jwt_admin_token",
                                    }
                                ),
                        }
                    )
                );
            }
        );

        it("returns generic 'Invalid email or password' on non-existent account (anti-user enumeration)", async () => {
            mockAdmin.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(null),
            });

            const req = {
                body: { email: "nonexistent@example.com", password: "Password123" },
                headers: {},
                socket: { remoteAddress: "127.0.0.1" },
                originalUrl: "/api/v1/admin/login",
            } as any;

            const res = createMockRes(req);
            await adminLogin(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: "Invalid email or password",
                })
            );
        });

        it("returns generic 'Invalid email or password' and records failed login on password mismatch", async () => {
            const adminDoc = {
                _id: "507f1f77bcf86cd799439011",
                email: "ops@example.com",
                password: "hashed-password",
                status: USER_STATUS.LIVE,
            };

            mockAdmin.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(adminDoc),
            });
            mockAdmin.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue({ failedLoginAttempts: 2 }),
            });

            const { comparePassword } = require("@esparex/core/utils/auth");
            comparePassword.mockResolvedValueOnce(false);

            const req = {
                body: { email: "ops@example.com", password: "WrongPassword" },
                headers: {},
                socket: { remoteAddress: "127.0.0.1" },
                originalUrl: "/api/v1/admin/login",
            } as any;

            const res = createMockRes(req);
            await adminLogin(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: "Invalid email or password",
                })
            );
            expect(mockAdmin.updateOne).toHaveBeenCalledWith(
                { _id: expect.anything() },
                { $set: { failedLoginAttempts: 3 } }
            );
        });

        it("blocks login and returns 429 when admin account is temporarily locked", async () => {
            const lockedAdmin = {
                _id: "507f1f77bcf86cd799439011",
                email: "ops@example.com",
                password: "hashed-password",
                status: USER_STATUS.LIVE,
                lockUntil: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes in future
            };

            mockAdmin.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(lockedAdmin),
            });

            const req = {
                body: { email: "ops@example.com", password: "Admin@12345" },
                headers: {},
                socket: { remoteAddress: "127.0.0.1" },
                originalUrl: "/api/v1/admin/login",
            } as any;

            const res = createMockRes(req);
            await adminLogin(req, res);

            expect(res.status).toHaveBeenCalledWith(429);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: expect.stringContaining("Account is temporarily locked"),
                })
            );
        });

        it(
            "resets password without pre-hashing in controller (model hook handles hashing)",
            async () => {
                const save = jest
                    .fn()
                    .mockResolvedValue(
                        undefined
                    );

                const adminDoc = {
                    _id:
                        "507f1f77bcf86cd799439011",

                    resetPasswordToken:
                        crypto
                            .createHash(
                                "sha256"
                            )
                            .update(
                                "raw-reset-token"
                            )
                            .digest(
                                "hex"
                            ),

                    resetPasswordExpire:
                        new Date(
                            Date.now() +
                            60_000
                        ),

                    password:
                        "old-password",

                    save,
                };

                mockAdmin.findOne.mockResolvedValue(
                    adminDoc
                );

                const req = {
                    params: {
                        token: "raw-reset-token",
                    },

                    body: {
                        password:
                            "NewSecurePassword123!",
                    },
                } as any;

                const res =
                    createMockRes(req);

                await resetPassword(
                    req,
                    res
                );

                expect(
                    adminDoc.password
                ).toBe(
                    "NewSecurePassword123!"
                );

                expect(
                    save
                ).toHaveBeenCalled();

                expect(
                    res.status
                ).toHaveBeenCalledWith(
                    200
                );

                expect(
                    res.json
                ).toHaveBeenCalledWith(
                    expect.objectContaining(
                        {
                            success: true,
                        }
                    )
                );

                expect(
                    mockRevokeAdminSessionsForAdmin
                ).toHaveBeenCalledWith(
                    "507f1f77bcf86cd799439011"
                );
            }
        );
    }
);