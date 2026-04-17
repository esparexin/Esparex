jest.mock("../../models/User", () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
        find: jest.fn(),
        countDocuments: jest.fn(),
        findById: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        create: jest.fn(),
    },
}));

jest.mock("../../models/Admin", () => ({
    __esModule: true,
    default: {
        findById: jest.fn(),
        countDocuments: jest.fn(),
        find: jest.fn(),
        create: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        findOne: jest.fn(),
    },
}));

jest.mock("../../models/Ad", () => ({
    __esModule: true,
    default: {
        aggregate: jest.fn(),
    },
}));

jest.mock("../../models/AdminMetrics", () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
    },
}));

jest.mock("../../utils/auth", () => ({
    hashPassword: jest.fn().mockResolvedValue("hashed-pw"),
}));

import Admin from "../../models/Admin";
import {
    normalizeAdminManagedUser,
    isLastActiveSuperAdmin,
} from "../../services/AdminUsersService";

const mockAdmin = Admin as unknown as {
    findById: jest.Mock;
    countDocuments: jest.Mock;
};

describe("AdminUsersService", () => {
    beforeEach(() => jest.clearAllMocks());

    // ─── normalizeAdminManagedUser ────────────────────────────────────────────

    describe("normalizeAdminManagedUser", () => {
        it("calls toObject() when available and normalizes status", () => {
            const doc = {
                toObject: () => ({ status: "active", name: "Alice" }),
            };
            const result = normalizeAdminManagedUser(doc as unknown as Record<string, unknown>);
            // normalizeUserStatus maps 'active' → 'live'
            expect(result.status).toBe("live");
            expect(result.name).toBe("Alice");
        });

        it("falls back to spread when toObject is absent", () => {
            const plain = { status: "suspended", email: "x@example.com" };
            const result = normalizeAdminManagedUser(plain);
            expect(result.status).toBe("suspended");
            expect(result.email).toBe("x@example.com");
        });

        it("leaves status unchanged when normalizeUserStatus returns null", () => {
            const plain = { status: "unknown_status_xyz" };
            const result = normalizeAdminManagedUser(plain);
            // normalizeUserStatus returns null for unknown → unchanged
            expect(result.status).toBe("unknown_status_xyz");
        });
    });

    // ─── isLastActiveSuperAdmin ───────────────────────────────────────────────

    describe("isLastActiveSuperAdmin", () => {
        it("returns true when target IS the sole active super_admin", async () => {
            // USER_STATUS.ACTIVE resolves to 'live' (it's an alias)
            mockAdmin.findById.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue({
                        role: "super_admin",
                        status: "live",
                    }),
                }),
            });
            mockAdmin.countDocuments.mockResolvedValue(1);

            const result = await isLastActiveSuperAdmin("admin_1");
            expect(result).toBe(true);
        });

        it("returns false when there are 2+ active super_admins", async () => {
            mockAdmin.findById.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue({
                        role: "super_admin",
                        status: "live",
                    }),
                }),
            });
            mockAdmin.countDocuments.mockResolvedValue(2);

            const result = await isLastActiveSuperAdmin("admin_1");
            expect(result).toBe(false);
        });

        it("returns false when target admin does not exist", async () => {
            mockAdmin.findById.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(null),
                }),
            });
            mockAdmin.countDocuments.mockResolvedValue(1);

            const result = await isLastActiveSuperAdmin("ghost_admin");
            expect(result).toBe(false);
        });

        it("returns false when target is not a super_admin", async () => {
            mockAdmin.findById.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue({
                        role: "moderator",
                        status: "active",
                    }),
                }),
            });
            mockAdmin.countDocuments.mockResolvedValue(1);

            const result = await isLastActiveSuperAdmin("mod_1");
            expect(result).toBe(false);
        });

        it("returns false when target super_admin is not active (status is 'suspended' not 'live')", async () => {
            mockAdmin.findById.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue({
                        role: "super_admin",
                        status: "suspended",  // Not 'live' → not active
                    }),
                }),
            });
            mockAdmin.countDocuments.mockResolvedValue(1);

            const result = await isLastActiveSuperAdmin("admin_suspended");
            expect(result).toBe(false);
        });
    });
});
